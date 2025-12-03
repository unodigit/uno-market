#!/usr/bin/env python3
"""
Pydantic Models for Python Web Scraper Plugin
Implements schema validation for all data structures
"""

from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Union

from pydantic import BaseModel, Field, HttpUrl, field_validator


# ============================================================================
# Enums
# ============================================================================

class PlatformType(str, Enum):
    """Supported platform types"""
    SHOPIFY = "shopify"
    WORDPRESS = "wordpress"
    WOOCOMMERCE = "woocommerce"
    MAGENTO = "magento"
    BIGCOMMERCE = "bigcommerce"
    CUSTOM = "custom"


class ScrapingStrategy(str, Enum):
    """Recommended scraping method"""
    API = "api"
    BROWSER = "browser"


class ConfidenceLevel(str, Enum):
    """Confidence level for detections"""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class PaginationType(str, Enum):
    """Pagination type"""
    INFINITE_SCROLL = "infinite_scroll"
    LOAD_MORE = "load_more"
    TRADITIONAL = "traditional"
    API_PAGINATION = "api_pagination"
    NONE = "none"


class ScrapingMethod(str, Enum):
    """Actual scraping method used"""
    API = "api"
    BROWSER = "browser"


# ============================================================================
# Investigation Report Models
# ============================================================================

class DiscoveredEndpoint(BaseModel):
    """API endpoint discovered during investigation"""
    url: HttpUrl = Field(..., description="Endpoint URL")
    method: str = Field(default="GET", description="HTTP method")
    response_type: str = Field(..., description="Content type")
    confidence: ConfidenceLevel = Field(..., description="Confidence level")
    tested: bool = Field(default=False, description="Whether endpoint was tested")
    status_code: Optional[int] = Field(None, description="HTTP status code")
    sample_fields: List[str] = Field(default_factory=list, description="Sample response fields")
    pagination_detected: bool = Field(default=False, description="Pagination indicators found")


class InvestigationMetadata(BaseModel):
    """Investigation session metadata"""
    investigation_duration_seconds: float = Field(..., ge=0)
    endpoints_probed: int = Field(..., ge=0)
    endpoints_found: int = Field(..., ge=0)
    techniques_used: List[str] = Field(default_factory=list)


class InvestigationReport(BaseModel):
    """Complete investigation report"""
    target_url: HttpUrl = Field(..., description="URL that was investigated")
    timestamp: str = Field(..., description="Investigation timestamp (ISO 8601)")
    discovered_endpoints: List[DiscoveredEndpoint] = Field(default_factory=list)
    platform_detected: PlatformType = Field(...)
    platform_confidence: ConfidenceLevel = Field(...)
    recommended_strategy: ScrapingStrategy = Field(...)
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    metadata: InvestigationMetadata = Field(...)


# ============================================================================
# Pagination Strategy Models
# ============================================================================

class ImplementationDetails(BaseModel):
    """Pagination implementation details"""
    scroll_strategy: Optional[str] = Field(None, description="For infinite scroll")
    wait_time_ms: int = Field(default=2000, ge=100, le=30000)
    end_condition: str = Field(..., description="When to stop pagination")
    max_pages: Optional[int] = Field(None, ge=1, description="Maximum pages to scrape")
    items_per_page: Optional[int] = Field(None, ge=1, description="Items per page estimate")


class PaginationSelectors(BaseModel):
    """Selectors for pagination controls"""
    next_button: Optional[str] = Field(None, description="Next button selector")
    load_more_button: Optional[str] = Field(None, description="Load more button selector")
    item_container: str = Field(..., description="Item container selector")
    pagination_container: Optional[str] = Field(None, description="Pagination container selector")


class PaginationStrategy(BaseModel):
    """Detected pagination strategy"""
    pagination_type: PaginationType = Field(...)
    implementation_details: ImplementationDetails = Field(...)
    selectors: PaginationSelectors = Field(...)
    confidence: ConfidenceLevel = Field(...)
    detected_page_count: Optional[int] = Field(None, ge=1)
    notes: Optional[str] = Field(None, description="Additional notes")


# ============================================================================
# DOM Selectors Models
# ============================================================================

class FieldSelector(BaseModel):
    """Selector for a specific field"""
    primary: str = Field(..., description="Primary CSS selector")
    fallback: Optional[str] = Field(None, description="Fallback selector")
    xpath: Optional[str] = Field(None, description="XPath alternative")
    attribute: Optional[str] = Field(None, description="Attribute to extract")
    confidence: ConfidenceLevel = Field(...)
    extraction_notes: Optional[str] = Field(None)


class DOMSelectorMap(BaseModel):
    """Map of field selectors"""
    item_container_selector: str = Field(...)
    field_selectors: Dict[str, FieldSelector] = Field(..., min_length=4)
    confidence_scores: Dict[str, float] = Field(...)
    page_url: HttpUrl = Field(...)
    analysis_timestamp: str = Field(...)
    total_items_found: int = Field(..., ge=0)
    notes: Optional[str] = Field(None)


# ============================================================================
# Scraped Items Models
# ============================================================================

class Price(BaseModel):
    """Price information"""
    amount: float = Field(..., ge=0, description="Numeric price")
    currency: str = Field(..., min_length=3, max_length=3, description="ISO 4217 currency code")
    display_text: Optional[str] = Field(None, description="Original price text")


class ScrapedItem(BaseModel):
    """Single scraped item"""
    id: Optional[str] = Field(None, description="Item ID")
    title: str = Field(..., min_length=1, description="Item title/name")
    price: Optional[Price] = Field(None, description="Price information")
    image_urls: List[str] = Field(default_factory=list, description="Image URLs")
    url: str = Field(..., description="Item URL")
    description: Optional[str] = Field(None, description="Item description")
    scraped_at: str = Field(..., description="Timestamp when item was scraped (ISO 8601)")

    @field_validator('scraped_at')
    @classmethod
    def validate_iso8601(cls, v: str) -> str:
        """Validate ISO 8601 format"""
        try:
            datetime.fromisoformat(v.replace('Z', '+00:00'))
            return v
        except ValueError:
            raise ValueError(f"Invalid ISO 8601 timestamp: {v}")


class ItemsOutput(BaseModel):
    """Items output file structure"""
    metadata_file: str = Field(..., description="Associated metadata filename")
    items: List[ScrapedItem] = Field(..., description="List of scraped items")


# ============================================================================
# Metadata Output Models
# ============================================================================

class ScrapingSession(BaseModel):
    """Scraping session information"""
    source_url: HttpUrl = Field(...)
    source_name: str = Field(..., min_length=1)
    scrape_timestamp_start: str = Field(...)
    scrape_timestamp_end: str = Field(...)
    duration_seconds: float = Field(..., gt=0)
    scraping_method: ScrapingMethod = Field(...)
    page_type: str = Field(default="listing_page")


class PaginationInfo(BaseModel):
    """Pagination information"""
    type: str = Field(...)
    total_pages: Optional[int] = Field(None, ge=1)
    items_per_page: Optional[int] = Field(None, ge=1)


class ItemsSummary(BaseModel):
    """Summary of scraped items"""
    total_items_found: int = Field(..., ge=0)
    items_successfully_scraped: int = Field(..., ge=0)
    items_with_errors: int = Field(default=0, ge=0)
    data_quality_percentage: float = Field(..., ge=0, le=100)


class FieldCompleteness(BaseModel):
    """Field completeness percentages"""
    title: float = Field(..., ge=0, le=100)
    price: float = Field(..., ge=0, le=100)
    image_urls: float = Field(..., ge=0, le=100)
    description: float = Field(..., ge=0, le=100)


class InvestigationNotes(BaseModel):
    """Investigation notes"""
    api_endpoints_found: List[str] = Field(default_factory=list)
    api_used: bool = Field(...)
    fallback_reason: Optional[str] = Field(None)
    platform_detected: Optional[str] = Field(None)


class OutputFiles(BaseModel):
    """Output file references"""
    items_file: str = Field(..., pattern=r"^.+_items_\d{8}_\d{6}\.json$")
    metadata_file: str = Field(..., pattern=r"^.+_metadata_\d{8}_\d{6}\.json$")


class MetadataOutput(BaseModel):
    """Metadata output file structure"""
    scraping_session: ScrapingSession = Field(...)
    pagination_info: PaginationInfo = Field(...)
    items_summary: ItemsSummary = Field(...)
    field_completeness: FieldCompleteness = Field(...)
    investigation_notes: InvestigationNotes = Field(...)
    output_files: OutputFiles = Field(...)


# ============================================================================
# QA Validation Models
# ============================================================================

class QACheckResult(BaseModel):
    """Result of a single QA check"""
    check_name: str = Field(...)
    status: str = Field(..., pattern="^(PASS|FAIL)$")
    details: Dict = Field(...)


class RootCauseAnalysis(BaseModel):
    """Root cause analysis for QA failure"""
    issue: str = Field(...)
    field: Optional[str] = Field(None)
    description: str = Field(...)
    recommendation: str = Field(...)


class QAReport(BaseModel):
    """QA cross-check report"""
    status: str = Field(..., pattern="^(PASS|FAIL)$")
    checks: Dict[str, QACheckResult] = Field(...)
    data_quality_score: float = Field(..., ge=0, le=100)
    timestamp: str = Field(...)
    root_cause_analysis: Optional[List[RootCauseAnalysis]] = Field(None)
    recommended_actions: Optional[List[str]] = Field(None)


# ============================================================================
# Configuration Models
# ============================================================================

class PlatformDetection(BaseModel):
    """Platform detection patterns"""
    meta_tag: Optional[str] = Field(None)
    script_src: Optional[str] = Field(None)
    html_patterns: List[str] = Field(default_factory=list)


class PlatformPagination(BaseModel):
    """Platform-specific pagination config"""
    type: str = Field(...)
    param_name: str = Field(...)
    items_per_page: int = Field(..., ge=1)


class PlatformPattern(BaseModel):
    """Platform-specific patterns"""
    detection: PlatformDetection = Field(...)
    api_endpoints: List[str] = Field(default_factory=list)
    pagination: PlatformPagination = Field(...)


# ============================================================================
# Validation Functions
# ============================================================================

def validate_investigation_report(data: dict) -> InvestigationReport:
    """Validate investigation report data"""
    return InvestigationReport.model_validate(data)


def validate_pagination_strategy(data: dict) -> PaginationStrategy:
    """Validate pagination strategy data"""
    return PaginationStrategy.model_validate(data)


def validate_dom_selectors(data: dict) -> DOMSelectorMap:
    """Validate DOM selector map data"""
    return DOMSelectorMap.model_validate(data)


def validate_items_output(data: dict) -> ItemsOutput:
    """Validate items output data"""
    return ItemsOutput.model_validate(data)


def validate_metadata_output(data: dict) -> MetadataOutput:
    """Validate metadata output data"""
    return MetadataOutput.model_validate(data)


def validate_qa_report(data: dict) -> QAReport:
    """Validate QA report data"""
    return QAReport.model_validate(data)
