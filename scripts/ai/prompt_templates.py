"""
Prompt Templates - Reusable AI prompt templates.

This module provides a collection of reusable prompt templates for
common AI tasks and operations.
"""

from dataclasses import dataclass
from typing import Any, Optional

from scripts.core.logger import get_logger

logger = get_logger(__name__)


@dataclass
class PromptTemplate:
    """Prompt template with variables."""

    name: str
    template: str
    description: str
    variables: list[str]

    def render(self, **kwargs: Any) -> str:
        """
        Render template with provided variables.

        Args:
            **kwargs: Variable values

        Returns:
            Rendered prompt string
        """
        missing = set(self.variables) - set(kwargs.keys())
        if missing:
            logger.warning(f"Missing template variables: {missing}")

        return self.template.format(**kwargs)


class PromptTemplates:
    """Collection of prompt templates."""

    CODE_REVIEW = PromptTemplate(
        name="code_review",
        description="Review code for quality, bugs, and improvements",
        variables=["code", "language"],
        template="""Review the following {language} code and provide feedback on:
1. Code quality and best practices
2. Potential bugs or issues
3. Performance improvements
4. Security concerns
5. Suggested refactorings

Code:
```{language}
{code}
```

Provide detailed, actionable feedback.""",
    )

    CODE_EXPLAIN = PromptTemplate(
        name="code_explain",
        description="Explain what code does",
        variables=["code", "language"],
        template="""Explain what this {language} code does in clear, simple terms:

```{language}
{code}
```

Provide:
1. High-level overview
2. Step-by-step breakdown
3. Input/output description
4. Use cases""",
    )

    CODE_OPTIMIZE = PromptTemplate(
        name="code_optimize",
        description="Optimize code for performance",
        variables=["code", "language"],
        template="""Optimize this {language} code for better performance:

```{language}
{code}
```

Provide:
1. Optimized version of the code
2. Explanation of improvements
3. Performance impact analysis""",
    )

    CODE_DOCUMENT = PromptTemplate(
        name="code_document",
        description="Generate documentation for code",
        variables=["code", "language", "style"],
        template="""Generate {style} style documentation for this {language} code:

```{language}
{code}
```

Include:
1. Function/class descriptions
2. Parameter documentation
3. Return value documentation
4. Usage examples
5. Notes and warnings""",
    )

    BUG_ANALYSIS = PromptTemplate(
        name="bug_analysis",
        description="Analyze bug and suggest fixes",
        variables=["code", "error", "language"],
        template="""Analyze this bug and suggest fixes:

Language: {language}

Code:
```{language}
{code}
```

Error:
```
{error}
```

Provide:
1. Root cause analysis
2. Suggested fix
3. Prevention strategies
4. Test cases""",
    )

    DATA_ANALYSIS = PromptTemplate(
        name="data_analysis",
        description="Analyze data and provide insights",
        variables=["data", "context"],
        template="""Analyze this data and provide insights:

Context: {context}

Data:
```
{data}
```

Provide:
1. Key findings
2. Patterns and trends
3. Anomalies or outliers
4. Recommendations
5. Visualizations suggestions""",
    )

    CONTENT_SUMMARY = PromptTemplate(
        name="content_summary",
        description="Summarize content",
        variables=["content", "max_length"],
        template="""Summarize the following content in {max_length} words or less:

{content}

Provide a concise summary highlighting the key points.""",
    )

    TEXT_CLASSIFICATION = PromptTemplate(
        name="text_classification",
        description="Classify text into categories",
        variables=["text", "categories"],
        template="""Classify the following text into one of these categories: {categories}

Text:
{text}

Respond with:
1. The most appropriate category
2. Confidence level (0-100%)
3. Reasoning for the classification""",
    )

    ENTITY_EXTRACTION = PromptTemplate(
        name="entity_extraction",
        description="Extract entities from text",
        variables=["text", "entity_types"],
        template="""Extract the following entity types from the text: {entity_types}

Text:
{text}

Return entities in a structured format with:
- Entity text
- Entity type
- Confidence
- Context""",
    )

    TRANSLATION = PromptTemplate(
        name="translation",
        description="Translate text to another language",
        variables=["text", "source_lang", "target_lang"],
        template="""Translate the following text from {source_lang} to {target_lang}:

{text}

Provide:
1. Direct translation
2. Notes on cultural context if relevant
3. Alternative translations if applicable""",
    )

    @classmethod
    def get_template(cls, name: str) -> Optional[PromptTemplate]:
        """Get template by name."""
        for attr_name in dir(cls):
            attr = getattr(cls, attr_name)
            if isinstance(attr, PromptTemplate) and attr.name == name:
                return attr
        return None

    @classmethod
    def list_templates(cls) -> list[PromptTemplate]:
        """Get all available templates."""
        templates = []
        for attr_name in dir(cls):
            attr = getattr(cls, attr_name)
            if isinstance(attr, PromptTemplate):
                templates.append(attr)
        return templates
