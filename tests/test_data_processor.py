"""Tests for data processor."""

import pandas as pd
import pytest

from scripts.automation.data_processor import DataProcessor


def test_processor_initialization():
    """Test data processor initialization."""
    processor = DataProcessor()
    assert processor is not None


def test_clean_data():
    """Test data cleaning."""
    processor = DataProcessor()
    df = pd.DataFrame({
        "col1": ["a", "b", "a", "c"],
        "col2": [1, 2, 1, 3],
    })

    cleaned = processor.clean_data(df, drop_duplicates=True)
    assert len(cleaned) == 3
