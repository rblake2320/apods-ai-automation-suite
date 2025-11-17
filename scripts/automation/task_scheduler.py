"""
Task Scheduler - Task scheduling with APScheduler.

This module provides comprehensive task scheduling capabilities with support
for cron-like schedules, intervals, one-time tasks, and task monitoring.
"""

import asyncio
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Callable, Optional
from uuid import uuid4

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.date import DateTrigger
from apscheduler.triggers.interval import IntervalTrigger
from pydantic import BaseModel, Field

from scripts.core.constants import TaskStatus
from scripts.core.exceptions import TaskExecutionError
from scripts.core.logger import get_logger

logger = get_logger(__name__)


@dataclass
class TaskExecutionResult:
    """Result of task execution."""

    task_id: str
    task_name: str
    status: TaskStatus
    start_time: datetime
    end_time: Optional[datetime] = None
    result: Any = None
    error: Optional[str] = None
    duration_seconds: float = 0.0

    @property
    def success(self) -> bool:
        """Check if execution was successful."""
        return self.status == TaskStatus.COMPLETED


class Task(BaseModel):
    """Task configuration."""

    id: str = Field(default_factory=lambda: str(uuid4()), description="Unique task ID")
    name: str = Field(..., description="Task name")
    func: Any = Field(..., description="Function to execute")
    args: tuple = Field(default_factory=tuple, description="Positional arguments")
    kwargs: dict[str, Any] = Field(default_factory=dict, description="Keyword arguments")
    schedule_type: str = Field(..., description="Schedule type (interval, cron, date)")
    schedule_config: dict[str, Any] = Field(
        default_factory=dict, description="Schedule configuration"
    )
    enabled: bool = Field(default=True, description="Task enabled status")
    max_retries: int = Field(default=3, ge=0, description="Maximum retry attempts")
    retry_delay: int = Field(default=60, ge=0, description="Retry delay in seconds")

    class Config:
        arbitrary_types_allowed = True


class TaskScheduler:
    """
    Comprehensive task scheduler.

    Features:
    - Cron-style scheduling
    - Interval-based scheduling
    - One-time scheduled tasks
    - Async task support
    - Task monitoring and logging
    - Retry logic
    - Task persistence
    """

    def __init__(
        self,
        timezone: str = "UTC",
        max_concurrent_tasks: int = 10,
    ) -> None:
        """
        Initialize task scheduler.

        Args:
            timezone: Timezone for scheduling
            max_concurrent_tasks: Maximum concurrent task executions
        """
        self.scheduler = AsyncIOScheduler(timezone=timezone)
        self.max_concurrent_tasks = max_concurrent_tasks
        self.tasks: dict[str, Task] = {}
        self.execution_history: list[TaskExecutionResult] = []
        self._semaphore = asyncio.Semaphore(max_concurrent_tasks)
        self._running = False

    def start(self) -> None:
        """Start the scheduler."""
        if not self._running:
            logger.info("Starting task scheduler")
            self.scheduler.start()
            self._running = True
            logger.info("Task scheduler started")

    def stop(self) -> None:
        """Stop the scheduler."""
        if self._running:
            logger.info("Stopping task scheduler")
            self.scheduler.shutdown()
            self._running = False
            logger.info("Task scheduler stopped")

    def add_interval_task(
        self,
        func: Callable,
        seconds: Optional[int] = None,
        minutes: Optional[int] = None,
        hours: Optional[int] = None,
        days: Optional[int] = None,
        name: Optional[str] = None,
        args: Optional[tuple] = None,
        kwargs: Optional[dict[str, Any]] = None,
        **task_kwargs: Any,
    ) -> Task:
        """
        Add a task that runs at regular intervals.

        Args:
            func: Function to execute
            seconds: Interval in seconds
            minutes: Interval in minutes
            hours: Interval in hours
            days: Interval in days
            name: Task name
            args: Positional arguments for func
            kwargs: Keyword arguments for func
            **task_kwargs: Additional task configuration

        Returns:
            Created Task object
        """
        name = name or func.__name__

        task = Task(
            name=name,
            func=func,
            args=args or (),
            kwargs=kwargs or {},
            schedule_type="interval",
            schedule_config={
                "seconds": seconds,
                "minutes": minutes,
                "hours": hours,
                "days": days,
            },
            **task_kwargs,
        )

        # Create trigger
        trigger = IntervalTrigger(
            seconds=seconds or 0,
            minutes=minutes or 0,
            hours=hours or 0,
            days=days or 0,
        )

        # Add job to scheduler
        self.scheduler.add_job(
            self._execute_task,
            trigger=trigger,
            args=[task],
            id=task.id,
            name=task.name,
            replace_existing=True,
        )

        self.tasks[task.id] = task

        logger.info(
            f"Added interval task: {task.name} "
            f"(every {days or 0}d {hours or 0}h {minutes or 0}m {seconds or 0}s)"
        )

        return task

    def add_cron_task(
        self,
        func: Callable,
        cron_expression: Optional[str] = None,
        year: Optional[str] = None,
        month: Optional[str] = None,
        day: Optional[str] = None,
        week: Optional[str] = None,
        day_of_week: Optional[str] = None,
        hour: Optional[str] = None,
        minute: Optional[str] = None,
        second: Optional[str] = None,
        name: Optional[str] = None,
        args: Optional[tuple] = None,
        kwargs: Optional[dict[str, Any]] = None,
        **task_kwargs: Any,
    ) -> Task:
        """
        Add a task with cron-style scheduling.

        Args:
            func: Function to execute
            cron_expression: Cron expression string
            year: Year expression
            month: Month expression
            day: Day expression
            week: Week expression
            day_of_week: Day of week expression
            hour: Hour expression
            minute: Minute expression
            second: Second expression
            name: Task name
            args: Positional arguments for func
            kwargs: Keyword arguments for func
            **task_kwargs: Additional task configuration

        Returns:
            Created Task object

        Example:
            # Every day at 9:00 AM
            add_cron_task(my_func, hour='9', minute='0')

            # Every Monday at 10:30 AM
            add_cron_task(my_func, day_of_week='mon', hour='10', minute='30')
        """
        name = name or func.__name__

        task = Task(
            name=name,
            func=func,
            args=args or (),
            kwargs=kwargs or {},
            schedule_type="cron",
            schedule_config={
                "cron_expression": cron_expression,
                "year": year,
                "month": month,
                "day": day,
                "week": week,
                "day_of_week": day_of_week,
                "hour": hour,
                "minute": minute,
                "second": second,
            },
            **task_kwargs,
        )

        # Create trigger
        if cron_expression:
            # Parse cron expression (minute hour day month day_of_week)
            parts = cron_expression.split()
            trigger = CronTrigger(
                minute=parts[0] if len(parts) > 0 else "*",
                hour=parts[1] if len(parts) > 1 else "*",
                day=parts[2] if len(parts) > 2 else "*",
                month=parts[3] if len(parts) > 3 else "*",
                day_of_week=parts[4] if len(parts) > 4 else "*",
            )
        else:
            trigger = CronTrigger(
                year=year,
                month=month,
                day=day,
                week=week,
                day_of_week=day_of_week,
                hour=hour,
                minute=minute,
                second=second,
            )

        # Add job to scheduler
        self.scheduler.add_job(
            self._execute_task,
            trigger=trigger,
            args=[task],
            id=task.id,
            name=task.name,
            replace_existing=True,
        )

        self.tasks[task.id] = task

        logger.info(f"Added cron task: {task.name} with schedule: {cron_expression or 'custom'}")

        return task

    def add_one_time_task(
        self,
        func: Callable,
        run_date: datetime,
        name: Optional[str] = None,
        args: Optional[tuple] = None,
        kwargs: Optional[dict[str, Any]] = None,
        **task_kwargs: Any,
    ) -> Task:
        """
        Add a one-time task that runs at a specific date/time.

        Args:
            func: Function to execute
            run_date: Date and time to run the task
            name: Task name
            args: Positional arguments for func
            kwargs: Keyword arguments for func
            **task_kwargs: Additional task configuration

        Returns:
            Created Task object
        """
        name = name or func.__name__

        task = Task(
            name=name,
            func=func,
            args=args or (),
            kwargs=kwargs or {},
            schedule_type="date",
            schedule_config={"run_date": run_date.isoformat()},
            **task_kwargs,
        )

        # Create trigger
        trigger = DateTrigger(run_date=run_date)

        # Add job to scheduler
        self.scheduler.add_job(
            self._execute_task,
            trigger=trigger,
            args=[task],
            id=task.id,
            name=task.name,
            replace_existing=True,
        )

        self.tasks[task.id] = task

        logger.info(f"Added one-time task: {task.name} scheduled for {run_date}")

        return task

    def remove_task(self, task_id: str) -> bool:
        """
        Remove a task from the scheduler.

        Args:
            task_id: Task ID to remove

        Returns:
            True if task was removed, False otherwise
        """
        if task_id in self.tasks:
            try:
                self.scheduler.remove_job(task_id)
                del self.tasks[task_id]
                logger.info(f"Removed task: {task_id}")
                return True
            except Exception as e:
                logger.error(f"Failed to remove task {task_id}: {e}")
                return False
        return False

    def pause_task(self, task_id: str) -> bool:
        """
        Pause a task.

        Args:
            task_id: Task ID to pause

        Returns:
            True if task was paused, False otherwise
        """
        if task_id in self.tasks:
            try:
                self.scheduler.pause_job(task_id)
                self.tasks[task_id].enabled = False
                logger.info(f"Paused task: {task_id}")
                return True
            except Exception as e:
                logger.error(f"Failed to pause task {task_id}: {e}")
                return False
        return False

    def resume_task(self, task_id: str) -> bool:
        """
        Resume a paused task.

        Args:
            task_id: Task ID to resume

        Returns:
            True if task was resumed, False otherwise
        """
        if task_id in self.tasks:
            try:
                self.scheduler.resume_job(task_id)
                self.tasks[task_id].enabled = True
                logger.info(f"Resumed task: {task_id}")
                return True
            except Exception as e:
                logger.error(f"Failed to resume task {task_id}: {e}")
                return False
        return False

    def get_task(self, task_id: str) -> Optional[Task]:
        """Get task by ID."""
        return self.tasks.get(task_id)

    def list_tasks(self) -> list[Task]:
        """Get list of all tasks."""
        return list(self.tasks.values())

    def get_execution_history(
        self, task_id: Optional[str] = None, limit: int = 100
    ) -> list[TaskExecutionResult]:
        """
        Get task execution history.

        Args:
            task_id: Optional task ID to filter by
            limit: Maximum number of results

        Returns:
            List of TaskExecutionResult objects
        """
        history = self.execution_history

        if task_id:
            history = [h for h in history if h.task_id == task_id]

        return history[-limit:]

    async def _execute_task(self, task: Task) -> TaskExecutionResult:
        """Execute a task with retry logic."""
        async with self._semaphore:
            start_time = datetime.now()
            result = TaskExecutionResult(
                task_id=task.id,
                task_name=task.name,
                status=TaskStatus.RUNNING,
                start_time=start_time,
            )

            logger.info(f"Executing task: {task.name}")

            retries = 0
            while retries <= task.max_retries:
                try:
                    # Execute function
                    if asyncio.iscoroutinefunction(task.func):
                        task_result = await task.func(*task.args, **task.kwargs)
                    else:
                        task_result = task.func(*task.args, **task.kwargs)

                    # Success
                    result.status = TaskStatus.COMPLETED
                    result.result = task_result
                    result.end_time = datetime.now()
                    result.duration_seconds = (
                        result.end_time - start_time
                    ).total_seconds()

                    logger.info(
                        f"Task completed: {task.name} "
                        f"({result.duration_seconds:.2f}s)"
                    )

                    break

                except Exception as e:
                    logger.error(
                        f"Task failed: {task.name} (attempt {retries + 1}): {e}",
                        exc_info=True,
                    )

                    if retries < task.max_retries:
                        retries += 1
                        result.status = TaskStatus.RETRYING
                        await asyncio.sleep(task.retry_delay)
                    else:
                        result.status = TaskStatus.FAILED
                        result.error = str(e)
                        result.end_time = datetime.now()
                        result.duration_seconds = (
                            result.end_time - start_time
                        ).total_seconds()
                        logger.error(
                            f"Task failed permanently: {task.name} after "
                            f"{task.max_retries} retries"
                        )

            # Record execution
            self.execution_history.append(result)

            return result

    def __enter__(self) -> "TaskScheduler":
        """Context manager entry."""
        self.start()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        """Context manager exit."""
        self.stop()
