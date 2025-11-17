"""
Data Processor - Data extraction, transformation, and validation.

This module provides comprehensive data processing capabilities including
ETL operations, data cleaning, transformation, and validation.
"""

import csv
import json
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Callable, Optional

import pandas as pd
from pydantic import BaseModel

from scripts.core.constants import FileFormat
from scripts.core.exceptions import DataProcessingError, FileOperationError
from scripts.core.logger import get_logger
from scripts.utils.validation import DataValidator

logger = get_logger(__name__)


@dataclass
class ProcessingResult:
    """Result of a data processing operation."""

    success: bool
    records_processed: int = 0
    records_valid: int = 0
    records_invalid: int = 0
    output_file: Optional[str] = None
    errors: list[str] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)

    def __post_init__(self):
        """Import field after dataclass creation to avoid circular import."""
        from dataclasses import field as dataclass_field
        if not hasattr(self, 'errors'):
            self.errors = []
        if not hasattr(self, 'metadata'):
            self.metadata = {}


class DataProcessor:
    """
    Comprehensive data processing framework.

    Features:
    - ETL operations (Extract, Transform, Load)
    - Data cleaning and normalization
    - Format conversion
    - Data validation
    - Aggregation and grouping
    - Filtering and sorting
    - Custom transformations
    """

    def __init__(self) -> None:
        """Initialize data processor."""
        self.validator = DataValidator()

    def load_data(
        self, file_path: str | Path, file_format: Optional[FileFormat] = None
    ) -> pd.DataFrame:
        """
        Load data from file.

        Args:
            file_path: Path to data file
            file_format: File format (auto-detected if not provided)

        Returns:
            DataFrame with loaded data

        Raises:
            FileOperationError: If file cannot be loaded
        """
        file_path = Path(file_path)

        if not file_path.exists():
            raise FileOperationError(
                f"File not found: {file_path}",
                file_path=str(file_path),
                operation="load",
            )

        # Auto-detect format
        if not file_format:
            suffix = file_path.suffix.lower()
            format_map = {
                ".csv": FileFormat.CSV,
                ".json": FileFormat.JSON,
                ".xlsx": FileFormat.XLSX,
                ".parquet": FileFormat.PARQUET,
                ".xml": FileFormat.XML,
            }
            file_format = format_map.get(suffix)

        logger.info(f"Loading data from {file_path} (format: {file_format})")

        try:
            if file_format == FileFormat.CSV:
                df = pd.read_csv(file_path)
            elif file_format == FileFormat.JSON:
                df = pd.read_json(file_path)
            elif file_format == FileFormat.XLSX:
                df = pd.read_excel(file_path)
            elif file_format == FileFormat.PARQUET:
                df = pd.read_parquet(file_path)
            elif file_format == FileFormat.XML:
                df = pd.read_xml(file_path)
            else:
                raise DataProcessingError(
                    f"Unsupported file format: {file_format}",
                    operation="load",
                )

            logger.info(f"Loaded {len(df)} records with {len(df.columns)} columns")
            return df

        except Exception as e:
            logger.error(f"Failed to load data: {e}", exc_info=True)
            raise FileOperationError(
                f"Failed to load data from {file_path}",
                file_path=str(file_path),
                operation="load",
                original_error=e,
            ) from e

    def save_data(
        self,
        df: pd.DataFrame,
        file_path: str | Path,
        file_format: Optional[FileFormat] = None,
        **kwargs: Any,
    ) -> None:
        """
        Save data to file.

        Args:
            df: DataFrame to save
            file_path: Output file path
            file_format: File format (auto-detected if not provided)
            **kwargs: Additional arguments for save function

        Raises:
            FileOperationError: If file cannot be saved
        """
        file_path = Path(file_path)
        file_path.parent.mkdir(parents=True, exist_ok=True)

        # Auto-detect format
        if not file_format:
            suffix = file_path.suffix.lower()
            format_map = {
                ".csv": FileFormat.CSV,
                ".json": FileFormat.JSON,
                ".xlsx": FileFormat.XLSX,
                ".parquet": FileFormat.PARQUET,
            }
            file_format = format_map.get(suffix)

        logger.info(f"Saving {len(df)} records to {file_path} (format: {file_format})")

        try:
            if file_format == FileFormat.CSV:
                df.to_csv(file_path, index=False, **kwargs)
            elif file_format == FileFormat.JSON:
                df.to_json(file_path, orient="records", **kwargs)
            elif file_format == FileFormat.XLSX:
                df.to_excel(file_path, index=False, **kwargs)
            elif file_format == FileFormat.PARQUET:
                df.to_parquet(file_path, index=False, **kwargs)
            else:
                raise DataProcessingError(
                    f"Unsupported file format: {file_format}",
                    operation="save",
                )

            logger.info(f"Data saved successfully to {file_path}")

        except Exception as e:
            logger.error(f"Failed to save data: {e}", exc_info=True)
            raise FileOperationError(
                f"Failed to save data to {file_path}",
                file_path=str(file_path),
                operation="save",
                original_error=e,
            ) from e

    def clean_data(
        self,
        df: pd.DataFrame,
        drop_duplicates: bool = True,
        drop_na: bool = False,
        fill_na: Optional[Any] = None,
        strip_strings: bool = True,
    ) -> pd.DataFrame:
        """
        Clean and normalize data.

        Args:
            df: Input DataFrame
            drop_duplicates: Remove duplicate rows
            drop_na: Drop rows with NA values
            fill_na: Value to fill NA with
            strip_strings: Strip whitespace from strings

        Returns:
            Cleaned DataFrame
        """
        logger.info(f"Cleaning data: {len(df)} records")

        df_clean = df.copy()

        # Remove duplicates
        if drop_duplicates:
            before = len(df_clean)
            df_clean = df_clean.drop_duplicates()
            logger.info(f"Removed {before - len(df_clean)} duplicate rows")

        # Handle NA values
        if drop_na:
            before = len(df_clean)
            df_clean = df_clean.dropna()
            logger.info(f"Removed {before - len(df_clean)} rows with NA values")
        elif fill_na is not None:
            df_clean = df_clean.fillna(fill_na)
            logger.info(f"Filled NA values with: {fill_na}")

        # Strip strings
        if strip_strings:
            for col in df_clean.select_dtypes(include=["object"]):
                df_clean[col] = df_clean[col].apply(
                    lambda x: x.strip() if isinstance(x, str) else x
                )

        logger.info(f"Cleaned data: {len(df_clean)} records remaining")
        return df_clean

    def transform_data(
        self,
        df: pd.DataFrame,
        transformations: dict[str, Callable[[Any], Any]],
    ) -> pd.DataFrame:
        """
        Apply custom transformations to columns.

        Args:
            df: Input DataFrame
            transformations: Dict mapping column names to transformation functions

        Returns:
            Transformed DataFrame

        Example:
            transformations = {
                'price': lambda x: float(x.replace('$', '')),
                'date': lambda x: pd.to_datetime(x),
                'name': lambda x: x.upper(),
            }
        """
        logger.info(f"Applying {len(transformations)} transformations")

        df_transformed = df.copy()

        for column, transform_func in transformations.items():
            if column in df_transformed.columns:
                try:
                    df_transformed[column] = df_transformed[column].apply(transform_func)
                    logger.debug(f"Transformed column: {column}")
                except Exception as e:
                    logger.error(f"Failed to transform column {column}: {e}")
                    raise DataProcessingError(
                        f"Transformation failed for column {column}",
                        operation="transform",
                        original_error=e,
                    ) from e
            else:
                logger.warning(f"Column not found: {column}")

        return df_transformed

    def filter_data(
        self,
        df: pd.DataFrame,
        filters: dict[str, Any],
    ) -> pd.DataFrame:
        """
        Filter data based on conditions.

        Args:
            df: Input DataFrame
            filters: Dict mapping column names to filter values

        Returns:
            Filtered DataFrame

        Example:
            filters = {
                'status': 'active',
                'price': lambda x: x > 100,
                'category': ['A', 'B', 'C'],
            }
        """
        logger.info(f"Applying {len(filters)} filters")

        df_filtered = df.copy()

        for column, condition in filters.items():
            if column not in df_filtered.columns:
                logger.warning(f"Column not found: {column}")
                continue

            before = len(df_filtered)

            if callable(condition):
                df_filtered = df_filtered[df_filtered[column].apply(condition)]
            elif isinstance(condition, (list, tuple)):
                df_filtered = df_filtered[df_filtered[column].isin(condition)]
            else:
                df_filtered = df_filtered[df_filtered[column] == condition]

            logger.info(f"Filter {column}: {before} -> {len(df_filtered)} records")

        return df_filtered

    def aggregate_data(
        self,
        df: pd.DataFrame,
        group_by: str | list[str],
        aggregations: dict[str, str | list[str]],
    ) -> pd.DataFrame:
        """
        Aggregate data by groups.

        Args:
            df: Input DataFrame
            group_by: Column(s) to group by
            aggregations: Dict mapping columns to aggregation functions

        Returns:
            Aggregated DataFrame

        Example:
            aggregations = {
                'sales': 'sum',
                'quantity': ['sum', 'mean'],
                'price': 'mean',
            }
        """
        logger.info(f"Aggregating data by {group_by}")

        try:
            df_agg = df.groupby(group_by).agg(aggregations).reset_index()
            logger.info(f"Aggregated to {len(df_agg)} groups")
            return df_agg

        except Exception as e:
            logger.error(f"Aggregation failed: {e}", exc_info=True)
            raise DataProcessingError(
                "Aggregation failed",
                operation="aggregate",
                original_error=e,
            ) from e

    def validate_data(
        self,
        df: pd.DataFrame,
        schema: dict[str, type],
        rules: Optional[dict[str, list[str]]] = None,
    ) -> ProcessingResult:
        """
        Validate data against schema and rules.

        Args:
            df: DataFrame to validate
            schema: Dict mapping column names to expected types
            rules: Optional validation rules per column

        Returns:
            ProcessingResult with validation outcome
        """
        logger.info(f"Validating {len(df)} records")

        errors = []
        valid_count = 0
        invalid_count = 0

        # Check required columns
        missing_cols = set(schema.keys()) - set(df.columns)
        if missing_cols:
            errors.append(f"Missing columns: {', '.join(missing_cols)}")

        # Validate data types
        for column, expected_type in schema.items():
            if column not in df.columns:
                continue

            try:
                # Type validation
                if not df[column].apply(lambda x: isinstance(x, expected_type) or pd.isna(x)).all():
                    errors.append(f"Invalid type in column {column}")

            except Exception as e:
                errors.append(f"Validation error for {column}: {e}")

        # Apply custom rules if provided
        if rules:
            for column, column_rules in rules.items():
                if column not in df.columns:
                    continue

                for value in df[column]:
                    if pd.notna(value):
                        try:
                            for rule in column_rules:
                                if not self.validator.validate(str(value), rule):
                                    invalid_count += 1
                                    break
                            else:
                                valid_count += 1
                        except Exception as e:
                            invalid_count += 1
                            errors.append(f"Rule validation failed for {column}: {e}")

        success = len(errors) == 0

        result = ProcessingResult(
            success=success,
            records_processed=len(df),
            records_valid=valid_count if rules else len(df),
            records_invalid=invalid_count,
            errors=errors,
            metadata={"columns": list(df.columns), "shape": df.shape},
        )

        if success:
            logger.info(f"Validation passed: {len(df)} records")
        else:
            logger.warning(f"Validation failed: {len(errors)} errors")

        return result

    def merge_data(
        self,
        left: pd.DataFrame,
        right: pd.DataFrame,
        on: str | list[str],
        how: str = "inner",
    ) -> pd.DataFrame:
        """
        Merge two DataFrames.

        Args:
            left: Left DataFrame
            right: Right DataFrame
            on: Column(s) to join on
            how: Join type (inner, outer, left, right)

        Returns:
            Merged DataFrame
        """
        logger.info(f"Merging data: {len(left)} x {len(right)} records")

        try:
            df_merged = pd.merge(left, right, on=on, how=how)
            logger.info(f"Merged result: {len(df_merged)} records")
            return df_merged

        except Exception as e:
            logger.error(f"Merge failed: {e}", exc_info=True)
            raise DataProcessingError(
                "Merge failed",
                operation="merge",
                original_error=e,
            ) from e
