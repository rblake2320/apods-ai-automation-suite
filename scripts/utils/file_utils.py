"""
File Utilities - Common file operation helpers.

This module provides utility functions for file operations including
reading, writing, path manipulation, and file information retrieval.
"""

import json
import shutil
from pathlib import Path
from typing import Any, Iterator, Optional

import yaml

from scripts.core.exceptions import FileOperationError
from scripts.core.logger import get_logger

logger = get_logger(__name__)


def ensure_dir(path: str | Path) -> Path:
    """
    Ensure directory exists, create if it doesn't.

    Args:
        path: Directory path

    Returns:
        Path object for the directory

    Raises:
        FileOperationError: If directory cannot be created
    """
    path = Path(path)

    try:
        path.mkdir(parents=True, exist_ok=True)
        return path
    except Exception as e:
        raise FileOperationError(
            f"Failed to create directory: {path}",
            file_path=str(path),
            operation="mkdir",
            original_error=e,
        ) from e


def read_file(file_path: str | Path, encoding: str = "utf-8") -> str:
    """
    Read file contents as string.

    Args:
        file_path: Path to file
        encoding: File encoding

    Returns:
        File contents as string

    Raises:
        FileOperationError: If file cannot be read
    """
    file_path = Path(file_path)

    try:
        with open(file_path, "r", encoding=encoding) as f:
            return f.read()
    except Exception as e:
        raise FileOperationError(
            f"Failed to read file: {file_path}",
            file_path=str(file_path),
            operation="read",
            original_error=e,
        ) from e


def write_file(
    file_path: str | Path,
    content: str,
    encoding: str = "utf-8",
    create_dirs: bool = True,
) -> None:
    """
    Write content to file.

    Args:
        file_path: Path to file
        content: Content to write
        encoding: File encoding
        create_dirs: Create parent directories if they don't exist

    Raises:
        FileOperationError: If file cannot be written
    """
    file_path = Path(file_path)

    try:
        if create_dirs:
            file_path.parent.mkdir(parents=True, exist_ok=True)

        with open(file_path, "w", encoding=encoding) as f:
            f.write(content)

        logger.debug(f"Written to file: {file_path}")

    except Exception as e:
        raise FileOperationError(
            f"Failed to write file: {file_path}",
            file_path=str(file_path),
            operation="write",
            original_error=e,
        ) from e


def read_json(file_path: str | Path) -> Any:
    """
    Read JSON file.

    Args:
        file_path: Path to JSON file

    Returns:
        Parsed JSON data

    Raises:
        FileOperationError: If file cannot be read or parsed
    """
    file_path = Path(file_path)

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise FileOperationError(
            f"Failed to read JSON file: {file_path}",
            file_path=str(file_path),
            operation="read_json",
            original_error=e,
        ) from e


def write_json(
    file_path: str | Path,
    data: Any,
    indent: int = 2,
    create_dirs: bool = True,
) -> None:
    """
    Write data to JSON file.

    Args:
        file_path: Path to JSON file
        data: Data to write
        indent: JSON indentation
        create_dirs: Create parent directories if they don't exist

    Raises:
        FileOperationError: If file cannot be written
    """
    file_path = Path(file_path)

    try:
        if create_dirs:
            file_path.parent.mkdir(parents=True, exist_ok=True)

        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=indent, ensure_ascii=False)

        logger.debug(f"Written JSON to file: {file_path}")

    except Exception as e:
        raise FileOperationError(
            f"Failed to write JSON file: {file_path}",
            file_path=str(file_path),
            operation="write_json",
            original_error=e,
        ) from e


def read_yaml(file_path: str | Path) -> Any:
    """
    Read YAML file.

    Args:
        file_path: Path to YAML file

    Returns:
        Parsed YAML data

    Raises:
        FileOperationError: If file cannot be read or parsed
    """
    file_path = Path(file_path)

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f)
    except Exception as e:
        raise FileOperationError(
            f"Failed to read YAML file: {file_path}",
            file_path=str(file_path),
            operation="read_yaml",
            original_error=e,
        ) from e


def write_yaml(
    file_path: str | Path,
    data: Any,
    create_dirs: bool = True,
) -> None:
    """
    Write data to YAML file.

    Args:
        file_path: Path to YAML file
        data: Data to write
        create_dirs: Create parent directories if they don't exist

    Raises:
        FileOperationError: If file cannot be written
    """
    file_path = Path(file_path)

    try:
        if create_dirs:
            file_path.parent.mkdir(parents=True, exist_ok=True)

        with open(file_path, "w", encoding="utf-8") as f:
            yaml.safe_dump(data, f, default_flow_style=False, sort_keys=False)

        logger.debug(f"Written YAML to file: {file_path}")

    except Exception as e:
        raise FileOperationError(
            f"Failed to write YAML file: {file_path}",
            file_path=str(file_path),
            operation="write_yaml",
            original_error=e,
        ) from e


def get_file_size(file_path: str | Path) -> int:
    """
    Get file size in bytes.

    Args:
        file_path: Path to file

    Returns:
        File size in bytes

    Raises:
        FileOperationError: If file doesn't exist
    """
    file_path = Path(file_path)

    if not file_path.exists():
        raise FileOperationError(
            f"File not found: {file_path}",
            file_path=str(file_path),
            operation="stat",
        )

    return file_path.stat().st_size


def get_file_size_human(file_path: str | Path) -> str:
    """
    Get human-readable file size.

    Args:
        file_path: Path to file

    Returns:
        Human-readable file size (e.g., "1.5 MB")
    """
    size_bytes = get_file_size(file_path)

    for unit in ["B", "KB", "MB", "GB", "TB"]:
        if size_bytes < 1024.0:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024.0

    return f"{size_bytes:.1f} PB"


def list_files(
    directory: str | Path,
    pattern: str = "*",
    recursive: bool = False,
) -> list[Path]:
    """
    List files in directory.

    Args:
        directory: Directory path
        pattern: File pattern (glob)
        recursive: Search recursively

    Returns:
        List of file paths

    Raises:
        FileOperationError: If directory doesn't exist
    """
    directory = Path(directory)

    if not directory.exists():
        raise FileOperationError(
            f"Directory not found: {directory}",
            file_path=str(directory),
            operation="list",
        )

    if recursive:
        files = directory.rglob(pattern)
    else:
        files = directory.glob(pattern)

    return [f for f in files if f.is_file()]


def copy_file(source: str | Path, destination: str | Path) -> None:
    """
    Copy file to destination.

    Args:
        source: Source file path
        destination: Destination path

    Raises:
        FileOperationError: If copy fails
    """
    source = Path(source)
    destination = Path(destination)

    try:
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)
        logger.debug(f"Copied: {source} -> {destination}")
    except Exception as e:
        raise FileOperationError(
            f"Failed to copy file",
            file_path=str(source),
            operation="copy",
            original_error=e,
        ) from e


def move_file(source: str | Path, destination: str | Path) -> None:
    """
    Move file to destination.

    Args:
        source: Source file path
        destination: Destination path

    Raises:
        FileOperationError: If move fails
    """
    source = Path(source)
    destination = Path(destination)

    try:
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(source), str(destination))
        logger.debug(f"Moved: {source} -> {destination}")
    except Exception as e:
        raise FileOperationError(
            f"Failed to move file",
            file_path=str(source),
            operation="move",
            original_error=e,
        ) from e


def delete_file(file_path: str | Path) -> None:
    """
    Delete file.

    Args:
        file_path: Path to file

    Raises:
        FileOperationError: If deletion fails
    """
    file_path = Path(file_path)

    try:
        file_path.unlink()
        logger.debug(f"Deleted: {file_path}")
    except Exception as e:
        raise FileOperationError(
            f"Failed to delete file",
            file_path=str(file_path),
            operation="delete",
            original_error=e,
        ) from e


def read_lines(file_path: str | Path, encoding: str = "utf-8") -> list[str]:
    """
    Read file lines as list.

    Args:
        file_path: Path to file
        encoding: File encoding

    Returns:
        List of lines

    Raises:
        FileOperationError: If file cannot be read
    """
    file_path = Path(file_path)

    try:
        with open(file_path, "r", encoding=encoding) as f:
            return f.readlines()
    except Exception as e:
        raise FileOperationError(
            f"Failed to read file lines",
            file_path=str(file_path),
            operation="read",
            original_error=e,
        ) from e


def write_lines(
    file_path: str | Path,
    lines: list[str],
    encoding: str = "utf-8",
    create_dirs: bool = True,
) -> None:
    """
    Write lines to file.

    Args:
        file_path: Path to file
        lines: Lines to write
        encoding: File encoding
        create_dirs: Create parent directories if they don't exist

    Raises:
        FileOperationError: If file cannot be written
    """
    file_path = Path(file_path)

    try:
        if create_dirs:
            file_path.parent.mkdir(parents=True, exist_ok=True)

        with open(file_path, "w", encoding=encoding) as f:
            f.writelines(lines)

        logger.debug(f"Written lines to file: {file_path}")

    except Exception as e:
        raise FileOperationError(
            f"Failed to write file lines",
            file_path=str(file_path),
            operation="write",
            original_error=e,
        ) from e


def iter_lines(
    file_path: str | Path,
    encoding: str = "utf-8",
    strip: bool = True,
) -> Iterator[str]:
    """
    Iterate over file lines.

    Args:
        file_path: Path to file
        encoding: File encoding
        strip: Strip whitespace from lines

    Yields:
        File lines

    Raises:
        FileOperationError: If file cannot be read
    """
    file_path = Path(file_path)

    try:
        with open(file_path, "r", encoding=encoding) as f:
            for line in f:
                yield line.strip() if strip else line
    except Exception as e:
        raise FileOperationError(
            f"Failed to iterate file lines",
            file_path=str(file_path),
            operation="read",
            original_error=e,
        ) from e
