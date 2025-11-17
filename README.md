# APODS AI-Automation Suite

A comprehensive, production-ready Python automation suite with AI capabilities, featuring web scraping, browser automation, API testing, data processing, and Claude AI integration.

## Features

### Core Capabilities

- **Web Scraping**: Advanced scraping with BeautifulSoup, robots.txt compliance, and rate limiting
- **Browser Automation**: Playwright-based automation for complex workflows
- **API Testing**: Comprehensive API testing with validation and load testing
- **Data Processing**: ETL operations, data cleaning, transformation, and validation
- **File Processing**: Batch file operations, compression, and organization
- **Task Scheduling**: Cron-style and interval-based task scheduling

### AI Integration

- **Claude AI Client**: Async/sync message generation with streaming support
- **Code Analysis**: AI-powered code review, bug detection, and optimization
- **Content Generation**: Text generation, summarization, and classification
- **Prompt Templates**: Reusable templates for common AI tasks

### Utilities

- **HTTP Client**: Async HTTP client with retry logic and rate limiting
- **File Utilities**: Comprehensive file operations (read, write, JSON, YAML)
- **Data Validation**: Email, URL, phone validation with custom rules
- **Crypto Utilities**: Encryption, decryption, and password hashing
- **Date Utilities**: Date parsing, formatting, and manipulation

## Installation

### Prerequisites

- Python 3.12 or higher
- pip package manager

### Install from source

```bash
git clone https://github.com/apods/ai-automation-suite.git
cd ai-automation-suite
pip install -r requirements.txt
pip install -e .
```

### Install Playwright browsers

```bash
playwright install
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp scripts/.env.example .env
```

Required variables:

- `APODS_AI__API_KEY`: Anthropic API key for AI features

### Configuration File

Edit `scripts/config.yaml` to customize settings:

```yaml
environment: 'production'
ai:
  model: 'claude-3-5-sonnet-20241022'
  max_tokens: 4096
logging:
  level: 'INFO'
```

## Usage

### CLI Interface

#### Web Scraping

```bash
# Scrape a website
apods scrape https://example.com -o output.json

# Scrape with custom format
apods scrape https://example.com -o output.csv --format csv
```

#### API Testing

```bash
# Test an API endpoint
apods test https://api.example.com/users --method GET --expected-status 200
```

#### Code Analysis

```bash
# Analyze code file
apods analyze mycode.py --language python

# With custom API key
apods analyze mycode.py --api-key sk-ant-...
```

#### Content Generation

```bash
# Generate content
apods generate "Write a technical blog post about Python async/await"

# Save to file
apods generate "Create a README for my project" -o README.md
```

### Python API

#### Web Scraping

```python
import asyncio
from scripts.automation.web_scraper import WebScraper

async def scrape_example():
    async with WebScraper() as scraper:
        result = await scraper.scrape("https://example.com")
        if result.success:
            print(f"Extracted {len(result.links)} links")

asyncio.run(scrape_example())
```

#### Browser Automation

```python
import asyncio
from scripts.automation.browser_automation import BrowserAutomation

async def automate_example():
    workflow = [
        {"action": "navigate", "url": "https://example.com"},
        {"action": "fill", "selector": "#search", "value": "test"},
        {"action": "click", "selector": "#submit"},
        {"action": "screenshot", "filename": "result.png"},
    ]

    async with BrowserAutomation(headless=True) as browser:
        results = await browser.execute_workflow(workflow)
        print(f"{len(results)} steps completed")

asyncio.run(automate_example())
```

#### API Testing

```python
import asyncio
from scripts.automation.api_tester import APITester, APITestCase
from scripts.core.constants import HTTPMethod

async def test_api():
    async with APITester(base_url="https://api.example.com") as tester:
        test_case = APITestCase(
            name="Get Users",
            method=HTTPMethod.GET,
            url="/users",
            expected_status=200,
        )
        result = await tester.test(test_case)
        print(f"Test {'passed' if result.success else 'failed'}")

asyncio.run(test_api())
```

#### AI Code Analysis

```python
import asyncio
import os
from scripts.ai.anthropic_client import AnthropicClient
from scripts.ai.code_analyzer import CodeAnalyzer

async def analyze_code():
    client = AnthropicClient(api_key=os.getenv("ANTHROPIC_API_KEY"))
    analyzer = CodeAnalyzer(client)

    code = """
    def factorial(n):
        return 1 if n <= 1 else n * factorial(n-1)
    """

    result = await analyzer.review_code(code, language="python")
    print(result.analysis)

asyncio.run(analyze_code())
```

#### Data Processing

```python
from scripts.automation.data_processor import DataProcessor

processor = DataProcessor()

# Load data
df = processor.load_data("data.csv")

# Clean data
df_clean = processor.clean_data(df, drop_duplicates=True, strip_strings=True)

# Transform data
transformations = {
    'price': lambda x: float(x.replace('$', '')),
    'date': lambda x: pd.to_datetime(x),
}
df_transformed = processor.transform_data(df_clean, transformations)

# Save data
processor.save_data(df_transformed, "output.json")
```

#### Task Scheduling

```python
from scripts.automation.task_scheduler import TaskScheduler

def my_task():
    print("Task executed!")

scheduler = TaskScheduler()
scheduler.start()

# Interval-based task
scheduler.add_interval_task(my_task, minutes=5, name="Periodic Task")

# Cron-style task (every day at 9 AM)
scheduler.add_cron_task(my_task, hour='9', minute='0', name="Daily Task")

# Keep scheduler running
try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    scheduler.stop()
```

## Project Structure

```
apods-ai-automation-suite/
├── scripts/
│   ├── core/               # Core functionality
│   │   ├── config.py       # Configuration management
│   │   ├── logger.py       # Logging setup
│   │   ├── exceptions.py   # Custom exceptions
│   │   └── constants.py    # Constants and enums
│   ├── automation/         # Automation modules
│   │   ├── web_scraper.py
│   │   ├── browser_automation.py
│   │   ├── api_tester.py
│   │   ├── data_processor.py
│   │   ├── file_processor.py
│   │   └── task_scheduler.py
│   ├── ai/                 # AI integration
│   │   ├── anthropic_client.py
│   │   ├── prompt_templates.py
│   │   ├── code_analyzer.py
│   │   └── content_generator.py
│   ├── utils/              # Utilities
│   │   ├── http_client.py
│   │   ├── file_utils.py
│   │   ├── validation.py
│   │   ├── crypto_utils.py
│   │   └── date_utils.py
│   ├── cli/                # CLI interface
│   │   └── commands/
│   ├── database/           # Database models
│   └── examples/           # Example scripts
├── tests/                  # Test suite
├── requirements.txt        # Python dependencies
├── setup.py               # Package setup
├── config.yaml            # Configuration file
└── .env.example           # Environment template
```

## Testing

Run the test suite:

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=scripts --cov-report=html

# Run specific tests
pytest tests/test_web_scraper.py

# Run async tests
pytest -m asyncio
```

## Development

### Code Quality

```bash
# Format code
black scripts/ tests/

# Lint code
ruff check scripts/ tests/

# Type checking
mypy scripts/
```

### Adding New Features

1. Create module in appropriate directory
2. Add tests in `tests/`
3. Update documentation
4. Add example usage in `examples/`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:

- GitHub Issues: https://github.com/apods/ai-automation-suite/issues
- Documentation: https://docs.apods.ai

## Changelog

### Version 1.0.0 (2024-01-15)

- Initial release
- Web scraping with BeautifulSoup
- Browser automation with Playwright
- API testing framework
- Data processing capabilities
- Claude AI integration
- Task scheduling
- CLI interface
- Comprehensive utilities

## Acknowledgments

- Anthropic for Claude AI
- Playwright team for browser automation
- BeautifulSoup for web scraping
- APScheduler for task scheduling
