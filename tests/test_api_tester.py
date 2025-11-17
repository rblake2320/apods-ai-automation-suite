"""Tests for API tester."""

import pytest

from scripts.automation.api_tester import APITestCase, APITester
from scripts.core.constants import HTTPMethod


def test_api_test_case_creation():
    """Test API test case creation."""
    test_case = APITestCase(
        name="Test Case",
        url="https://api.example.com/test",
        method=HTTPMethod.GET,
    )
    assert test_case.name == "Test Case"
    assert test_case.method == HTTPMethod.GET
