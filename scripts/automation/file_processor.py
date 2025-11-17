"""
File Processor - Batch file operations and management.

This module provides comprehensive file processing capabilities including
batch operations, file monitoring, compression, and organization.
"""

import hashlib
import shutil
import zipfile
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Callable, Optional

from scripts.core.exceptions import FileOperationError
from scripts.core.logger import get_logger

logger = get_logger(__name__)


class FileOperation(str, Enum):
    """File operation types."""

    COPY = "copy"
    MOVE = "move"
    DELETE = "delete"
    RENAME = "rename"
    COMPRESS = "compress"
    EXTRACT = "extract"
    ORGANIZE = "organize"


@dataclass
class FileOperationResult:
    """Result of a file operation."""

    operation: FileOperation
    source: str
    destination: Optional[str] = None
    success: bool = True
    error: Optional[str] = None
    metadata: dict = None

    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


class FileProcessor:
    """
    Comprehensive file processing framework.

    Features:
    - Batch file operations
    - File organization
    - Compression and extraction
    - File monitoring
    - Hash calculation
    - Duplicate detection
    - Pattern matching
    """

    def __init__(self, dry_run: bool = False) -> None:
        """
        Initialize file processor.

        Args:
            dry_run: If True, simulate operations without actually executing them
        """
        self.dry_run = dry_run

    def copy_files(
        self,
        source_pattern: str,
        destination: str | Path,
        recursive: bool = False,
    ) -> list[FileOperationResult]:
        """
        Copy files matching a pattern.

        Args:
            source_pattern: Source file pattern (glob)
            destination: Destination directory
            recursive: Search recursively

        Returns:
            List of FileOperationResult objects
        """
        destination = Path(destination)
        results = []

        logger.info(f"Copying files from {source_pattern} to {destination}")

        # Find matching files
        source_path = Path(source_pattern).parent
        pattern = Path(source_pattern).name

        if recursive:
            files = source_path.rglob(pattern)
        else:
            files = source_path.glob(pattern)

        for file_path in files:
            if not file_path.is_file():
                continue

            try:
                dest_file = destination / file_path.name
                destination.mkdir(parents=True, exist_ok=True)

                if not self.dry_run:
                    shutil.copy2(file_path, dest_file)

                logger.info(f"Copied: {file_path} -> {dest_file}")

                results.append(
                    FileOperationResult(
                        operation=FileOperation.COPY,
                        source=str(file_path),
                        destination=str(dest_file),
                        success=True,
                    )
                )

            except Exception as e:
                logger.error(f"Failed to copy {file_path}: {e}")
                results.append(
                    FileOperationResult(
                        operation=FileOperation.COPY,
                        source=str(file_path),
                        success=False,
                        error=str(e),
                    )
                )

        logger.info(f"Copy operation completed: {len(results)} files processed")
        return results

    def move_files(
        self,
        source_pattern: str,
        destination: str | Path,
        recursive: bool = False,
    ) -> list[FileOperationResult]:
        """
        Move files matching a pattern.

        Args:
            source_pattern: Source file pattern (glob)
            destination: Destination directory
            recursive: Search recursively

        Returns:
            List of FileOperationResult objects
        """
        destination = Path(destination)
        results = []

        logger.info(f"Moving files from {source_pattern} to {destination}")

        # Find matching files
        source_path = Path(source_pattern).parent
        pattern = Path(source_pattern).name

        if recursive:
            files = source_path.rglob(pattern)
        else:
            files = source_path.glob(pattern)

        for file_path in files:
            if not file_path.is_file():
                continue

            try:
                dest_file = destination / file_path.name
                destination.mkdir(parents=True, exist_ok=True)

                if not self.dry_run:
                    shutil.move(str(file_path), str(dest_file))

                logger.info(f"Moved: {file_path} -> {dest_file}")

                results.append(
                    FileOperationResult(
                        operation=FileOperation.MOVE,
                        source=str(file_path),
                        destination=str(dest_file),
                        success=True,
                    )
                )

            except Exception as e:
                logger.error(f"Failed to move {file_path}: {e}")
                results.append(
                    FileOperationResult(
                        operation=FileOperation.MOVE,
                        source=str(file_path),
                        success=False,
                        error=str(e),
                    )
                )

        logger.info(f"Move operation completed: {len(results)} files processed")
        return results

    def delete_files(
        self, pattern: str, recursive: bool = False, confirm: bool = True
    ) -> list[FileOperationResult]:
        """
        Delete files matching a pattern.

        Args:
            pattern: File pattern (glob)
            recursive: Search recursively
            confirm: Require confirmation before deletion

        Returns:
            List of FileOperationResult objects
        """
        results = []
        source_path = Path(pattern).parent
        file_pattern = Path(pattern).name

        logger.warning(f"Deleting files matching {pattern}")

        if recursive:
            files = list(source_path.rglob(file_pattern))
        else:
            files = list(source_path.glob(file_pattern))

        file_list = [f for f in files if f.is_file()]

        if confirm and not self.dry_run:
            logger.warning(f"About to delete {len(file_list)} files. Set confirm=False to proceed.")
            return results

        for file_path in file_list:
            try:
                if not self.dry_run:
                    file_path.unlink()

                logger.info(f"Deleted: {file_path}")

                results.append(
                    FileOperationResult(
                        operation=FileOperation.DELETE,
                        source=str(file_path),
                        success=True,
                    )
                )

            except Exception as e:
                logger.error(f"Failed to delete {file_path}: {e}")
                results.append(
                    FileOperationResult(
                        operation=FileOperation.DELETE,
                        source=str(file_path),
                        success=False,
                        error=str(e),
                    )
                )

        logger.info(f"Delete operation completed: {len(results)} files processed")
        return results

    def organize_files(
        self,
        source_dir: str | Path,
        organize_by: str = "extension",
        target_dir: Optional[str | Path] = None,
    ) -> list[FileOperationResult]:
        """
        Organize files into subdirectories.

        Args:
            source_dir: Source directory
            organize_by: Organization strategy (extension, date, size)
            target_dir: Target directory (uses source_dir if not provided)

        Returns:
            List of FileOperationResult objects
        """
        source_dir = Path(source_dir)
        target_dir = Path(target_dir) if target_dir else source_dir
        results = []

        logger.info(f"Organizing files in {source_dir} by {organize_by}")

        for file_path in source_dir.glob("*"):
            if not file_path.is_file():
                continue

            try:
                # Determine target subdirectory
                if organize_by == "extension":
                    subdir = file_path.suffix.lstrip(".") or "no_extension"
                elif organize_by == "date":
                    mtime = datetime.fromtimestamp(file_path.stat().st_mtime)
                    subdir = mtime.strftime("%Y-%m-%d")
                elif organize_by == "size":
                    size_mb = file_path.stat().st_size / (1024 * 1024)
                    if size_mb < 1:
                        subdir = "small"
                    elif size_mb < 10:
                        subdir = "medium"
                    else:
                        subdir = "large"
                else:
                    subdir = "other"

                dest_dir = target_dir / subdir
                dest_file = dest_dir / file_path.name

                dest_dir.mkdir(parents=True, exist_ok=True)

                if not self.dry_run:
                    shutil.move(str(file_path), str(dest_file))

                logger.info(f"Organized: {file_path} -> {dest_file}")

                results.append(
                    FileOperationResult(
                        operation=FileOperation.ORGANIZE,
                        source=str(file_path),
                        destination=str(dest_file),
                        success=True,
                    )
                )

            except Exception as e:
                logger.error(f"Failed to organize {file_path}: {e}")
                results.append(
                    FileOperationResult(
                        operation=FileOperation.ORGANIZE,
                        source=str(file_path),
                        success=False,
                        error=str(e),
                    )
                )

        logger.info(f"Organization completed: {len(results)} files processed")
        return results

    def compress_files(
        self,
        source_files: list[str | Path],
        archive_path: str | Path,
        compression: str = "zip",
    ) -> FileOperationResult:
        """
        Compress files into an archive.

        Args:
            source_files: List of files to compress
            archive_path: Output archive path
            compression: Compression format (zip)

        Returns:
            FileOperationResult
        """
        archive_path = Path(archive_path)

        logger.info(f"Compressing {len(source_files)} files to {archive_path}")

        try:
            archive_path.parent.mkdir(parents=True, exist_ok=True)

            if not self.dry_run:
                if compression == "zip":
                    with zipfile.ZipFile(archive_path, "w", zipfile.ZIP_DEFLATED) as zf:
                        for file_path in source_files:
                            file_path = Path(file_path)
                            if file_path.exists():
                                zf.write(file_path, file_path.name)
                                logger.debug(f"Added to archive: {file_path}")
                else:
                    raise FileOperationError(
                        f"Unsupported compression format: {compression}",
                        operation="compress",
                    )

            logger.info(f"Compression completed: {archive_path}")

            return FileOperationResult(
                operation=FileOperation.COMPRESS,
                source=f"{len(source_files)} files",
                destination=str(archive_path),
                success=True,
                metadata={"file_count": len(source_files)},
            )

        except Exception as e:
            logger.error(f"Compression failed: {e}", exc_info=True)
            return FileOperationResult(
                operation=FileOperation.COMPRESS,
                source=f"{len(source_files)} files",
                success=False,
                error=str(e),
            )

    def extract_archive(
        self, archive_path: str | Path, destination: str | Path
    ) -> FileOperationResult:
        """
        Extract an archive.

        Args:
            archive_path: Path to archive file
            destination: Destination directory

        Returns:
            FileOperationResult
        """
        archive_path = Path(archive_path)
        destination = Path(destination)

        logger.info(f"Extracting {archive_path} to {destination}")

        try:
            if not archive_path.exists():
                raise FileOperationError(
                    f"Archive not found: {archive_path}",
                    file_path=str(archive_path),
                    operation="extract",
                )

            destination.mkdir(parents=True, exist_ok=True)

            if not self.dry_run:
                if archive_path.suffix == ".zip":
                    with zipfile.ZipFile(archive_path, "r") as zf:
                        zf.extractall(destination)
                else:
                    raise FileOperationError(
                        f"Unsupported archive format: {archive_path.suffix}",
                        operation="extract",
                    )

            logger.info(f"Extraction completed to {destination}")

            return FileOperationResult(
                operation=FileOperation.EXTRACT,
                source=str(archive_path),
                destination=str(destination),
                success=True,
            )

        except Exception as e:
            logger.error(f"Extraction failed: {e}", exc_info=True)
            return FileOperationResult(
                operation=FileOperation.EXTRACT,
                source=str(archive_path),
                success=False,
                error=str(e),
            )

    def calculate_hash(self, file_path: str | Path, algorithm: str = "md5") -> str:
        """
        Calculate file hash.

        Args:
            file_path: Path to file
            algorithm: Hash algorithm (md5, sha1, sha256)

        Returns:
            Hex digest of file hash
        """
        file_path = Path(file_path)

        logger.debug(f"Calculating {algorithm} hash for {file_path}")

        hash_func = getattr(hashlib, algorithm)()

        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(8192), b""):
                hash_func.update(chunk)

        return hash_func.hexdigest()

    def find_duplicates(
        self, directory: str | Path, recursive: bool = True
    ) -> dict[str, list[Path]]:
        """
        Find duplicate files based on content hash.

        Args:
            directory: Directory to search
            recursive: Search recursively

        Returns:
            Dictionary mapping hashes to list of duplicate files
        """
        directory = Path(directory)
        file_hashes: dict[str, list[Path]] = {}

        logger.info(f"Searching for duplicates in {directory}")

        if recursive:
            files = directory.rglob("*")
        else:
            files = directory.glob("*")

        for file_path in files:
            if not file_path.is_file():
                continue

            try:
                file_hash = self.calculate_hash(file_path)

                if file_hash in file_hashes:
                    file_hashes[file_hash].append(file_path)
                else:
                    file_hashes[file_hash] = [file_path]

            except Exception as e:
                logger.warning(f"Failed to hash {file_path}: {e}")

        # Filter to only duplicates
        duplicates = {k: v for k, v in file_hashes.items() if len(v) > 1}

        logger.info(f"Found {len(duplicates)} groups of duplicate files")

        return duplicates
