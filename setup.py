"""Setup configuration for APODS AI-Automation Suite."""

from pathlib import Path

from setuptools import find_packages, setup

# Read README
readme_file = Path(__file__).parent / "README.md"
long_description = readme_file.read_text() if readme_file.exists() else ""

# Read requirements
requirements_file = Path(__file__).parent / "requirements.txt"
if requirements_file.exists():
    requirements = [
        line.strip()
        for line in requirements_file.read_text().splitlines()
        if line.strip() and not line.startswith("#")
    ]
else:
    requirements = []

setup(
    name="apods-ai-automation",
    version="1.0.0",
    author="APODS Team",
    author_email="team@apods.ai",
    description="Comprehensive automation suite with AI capabilities",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/apods/ai-automation-suite",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.12",
        "Topic :: Software Development :: Libraries :: Python Modules",
    ],
    python_requires=">=3.12",
    install_requires=requirements,
    entry_points={
        "console_scripts": [
            "apods=scripts.cli.main:cli",
        ],
    },
    include_package_data=True,
    zip_safe=False,
)
