# python-backend/api.py - AI-Driven Search with Creative Strategy Generation

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import asyncio
import aiohttp
import json
from datetime import datetime
import os
import re
import random
import logging

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI-Driven Company Research Agent", version="4.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Keys
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
SERPER_API_KEY = os.getenv("SERPER_API_KEY")

if OPENAI_API_KEY:
    try:
        from openai import AsyncOpenAI
        logger.info("✅ OpenAI API key loaded successfully")
    except ImportError:
        logger.warning("OpenAI package not installed")
        OPENAI_API_KEY = None
else:
    logger.warning("⚠️ OPENAI_API_KEY not found.")

if SERPER_API_KEY:
    logger.info("✅ Serper API key loaded successfully")
else:
    logger.warning("⚠️ No search API keys found.")

class SearchCriteria(BaseModel):
    industry: Optional[str] = None
    company_type: Optional[str] = None
    employee_range_min: Optional[int] = None
    employee_range_max: Optional[int] = None
    required_tools: List[str] = []
    location: Optional[str] = None
    company_examples: List[str] = []
    strict_matching: bool = True

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000)

class Company(BaseModel):
    name: str
    industry: str
    company_type: Optional[str] = None
    employee_count: Optional[int] = None
    employee_range: str
    website: str
    description: str
    tools_detected: List[str]
    location: Optional[str] = None
    founded: Optional[str] = None
    confidence_score: int
    match_reasons: List[str]
    search_source: str
    additional_data: Dict[str, Any] = {}

class SearchEvent(BaseModel):
    id: str
    message: str
    type: str
    timestamp: str

class SearchResult(BaseModel):
    companies: List[Company]
    search_criteria: SearchCriteria
    total_found: int
    criteria_matched: int
    search_summary: str
    reasoning: str
    execution_time: float
    search_events: List[SearchEvent]
    table_data: Optional[Dict[str, Any]] = None

class AISearchStrategyGenerator:
    """AI-powered search strategy generator with website guidance"""
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None
    
    async def generate_search_strategies(self, criteria: SearchCriteria, user_query: str) -> List[Dict[str, Any]]:
        """Let AI generate creative search strategies with website guidance"""
        
        if not self.client:
            return self.fallback_strategies(criteria)
        
        try:
            # Provide AI with guidance about effective search approaches
            guidance = self.get_search_guidance()
            
            prompt = f"""
            You are an expert researcher tasked with finding companies that match specific criteria.
            
            USER QUERY: "{user_query}"
            
            PARSED CRITERIA:
            - Industry: {criteria.industry or 'Any'}
            - Company Type: {criteria.company_type or 'Any'}
            - Employee Range: {criteria.employee_range_min or 0}-{criteria.employee_range_max or 'unlimited'}
            - Required Tools: {criteria.required_tools or 'None'}
            - Location: {criteria.location or 'Any'}
            - Example Companies: {criteria.company_examples or 'None'}
            - Strict Matching: {criteria.strict_matching}
            
            WEBSITE GUIDANCE FOR EFFECTIVE SEARCHES:
            {guidance}
            
            YOUR TASK: Generate 8-10 creative Google search queries that will find COMPANIES (not individual employees) matching the criteria.
            
            IMPORTANT RULES:
            1. Focus on finding COMPANY PAGES, not individual employee profiles
            2. Use the website guidance above to target the right places
            3. Be creative - think of indirect ways companies might be mentioned
            4. Vary your approaches - don't just repeat the same pattern
            5. Consider how companies showcase themselves vs. how employees mention them
            
            Return a JSON array of search strategies with this format:
            [
              {{
                "strategy_name": "Brief name for this approach",
                "search_query": "Exact Google search query",
                "reasoning": "Why this approach should find companies",
                "target_source": "What type of pages this targets (e.g., 'company directories', 'customer showcases')",
                "expected_results": "What kind of companies this might find"
              }}
            ]
            
            Be creative and think outside the box! Return only valid JSON.
            """
            
            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a creative research strategist expert at finding companies through unconventional search methods. Return only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,  # Higher temperature for creativity
                max_tokens=2000
            )
            
            strategies = json.loads(response.choices[0].message.content)
            logger.info(f"AI generated {len(strategies)} search strategies")
            
            # Log the strategies for debugging
            for i, strategy in enumerate(strategies):
                logger.info(f"Strategy {i+1}: {strategy.get('strategy_name', 'Unknown')} - {strategy.get('search_query', 'No query')}")
            
            return strategies
            
        except Exception as e:
            logger.error(f"AI strategy generation failed: {e}")
            return self.fallback_strategies(criteria)
    
    def get_search_guidance(self) -> str:
        """Provide guidance to AI about effective search approaches"""
        
        return """
        EFFECTIVE SEARCH LOCATIONS & TECHNIQUES:

        1. LINKEDIN COMPANY PAGES (not profiles):
           - Search: site:linkedin.com/company [industry] [tools] employees
           - Look for company pages, not individual profiles
           - Example: site:linkedin.com/company "saas" "salesforce" employees

        2. CRUNCHBASE COMPANY DATABASE:
           - Search: site:crunchbase.com/organization [industry] [size] [tools]
           - Rich company data with employee counts and descriptions
           - Example: site:crunchbase.com/organization fintech 100-500 employees

        3. COMPANY CUSTOMER SHOWCASES:
           - Search: "[tool] customers" OR "[tool] case studies" [industry]
           - Companies love to be featured as customers
           - Example: "salesforce customers" saas b2b OR "intercom case studies" 

        4. JOB BOARD COMPANY PROFILES:
           - Search: site:angel.co OR site:wellfound.com [industry] [tools] company
           - Companies describe themselves and their tech stack
           - Example: site:angel.co fintech "uses stripe" company

        5. COMPANY BLOG & TECH POSTS:
           - Search: "[industry] companies" "we use [tool]" OR "our tech stack"
           - Companies write about their technology choices
           - Example: "saas companies" "we use intercom" OR "our customer support"

        6. INDUSTRY DIRECTORIES & LISTS:
           - Search: "[industry] companies list" OR "top [industry] startups"
           - Industry publications often list companies
           - Example: "top fintech companies 2024" OR "saas directory"

        7. CONFERENCE & EVENT LISTINGS:
           - Search: "[industry] conference" speakers OR exhibitors [year]
           - Companies that speak at or sponsor events
           - Example: "saas conference 2024" speakers OR "fintech summit" exhibitors

        8. PRODUCT DIRECTORIES:
           - Search: site:producthunt.com [industry] [tools] OR site:capterra.com
           - Companies listed in product directories
           - Example: site:producthunt.com "customer support" saas

        9. GITHUB ORGANIZATION PAGES:
           - Search: site:github.com [company-name] OR [tool] integration
           - Companies often have public GitHub organizations
           - Example: site:github.com "stripe integration" company

        10. NEWS & PRESS MENTIONS:
            - Search: "[industry] company" funding OR acquisition OR launch [tool]
            - Companies mentioned in business news
            - Example: "fintech company" funding "uses stripe" OR "saas startup" launch

        KEY PRINCIPLES:
        - Always target COMPANY pages, not individual employee profiles
        - Use OR operators to expand searches: "customers" OR "case studies" OR "testimonials"
        - Combine industry + tools + company indicators: "saas" + "intercom" + "company"
        - Look for companies describing themselves, not employees describing companies
        - Target places where companies self-promote or are officially listed
        """
    
    def fallback_strategies(self, criteria: SearchCriteria) -> List[Dict[str, Any]]:
        """Fallback strategies when AI is not available"""
        
        strategies = []
        industry = criteria.industry or "technology"
        tools = criteria.required_tools
        
        # Basic fallback strategies
        if tools:
            for tool in tools[:2]:
                strategies.append({
                    "strategy_name": f"{tool} customer directory",
                    "search_query": f'"{tool} customers" OR "{tool} case studies" {industry} company',
                    "reasoning": f"Find companies featured as {tool} customers",
                    "target_source": "customer showcases",
                    "expected_results": f"Companies publicly using {tool}"
                })
        
        strategies.append({
            "strategy_name": "Industry company directory",
            "search_query": f'{industry} companies directory list',
            "reasoning": "Find companies in industry directories",
            "target_source": "industry directories",
            "expected_results": f"Companies in {industry} industry"
        })
        
        return strategies

class IntelligentSearchExecutor:
    """Executes AI-generated search strategies"""
    
    def __init__(self):
        self.api_key = SERPER_API_KEY
        self.session = None
    
    async def get_session(self):
        if not self.session:
            self.session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=30),
                headers={
                    'X-API-KEY': self.api_key,
                    'Content-Type': 'application/json'
                }
            )
        return self.session
    
    async def execute_search_strategy(self, strategy: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Execute a single AI-generated search strategy"""
        
        try:
            search_query = strategy["search_query"]
            logger.info(f"Executing: {strategy.get('strategy_name', 'Unknown')} - {search_query}")
            
            session = await self.get_session()
            url = "https://google.serper.dev/search"
            
            payload = {"q": search_query, "num": 12}
            
            async with session.post(url, json=payload) as response:
                if response.status == 200:
                    data = await response.json()
                    results = []
                    
                    for item in data.get('organic', []):
                        result = {
                            'title': item.get('title', ''),
                            'url': item.get('link', ''),
                            'snippet': item.get('snippet', ''),
                            'source': 'serper',
                            'search_strategy': strategy.get('strategy_name', 'Unknown'),
                            'strategy_reasoning': strategy.get('reasoning', ''),
                            'target_source': strategy.get('target_source', ''),
                            'expected_results': strategy.get('expected_results', '')
                        }
                        results.append(result)
                    
                    logger.info(f"Strategy returned {len(results)} results")
                    return results
                else:
                    logger.error(f"Search failed: {response.status}")
                    return []
                    
        except Exception as e:
            logger.error(f"Search execution error: {e}")
            return []
    
    async def close(self):
        if self.session:
            await self.session.close()

class SmartCompanyExtractor:
    """Intelligently extracts companies from search results"""
    
    def extract_company_from_result(self, result: Dict[str, Any], criteria: SearchCriteria) -> Optional[Company]:
        """Extract company information from search result"""
        
        try:
            # Skip obvious non-company results
            if self.should_skip_result(result):
                return None
            
            # Extract company name
            name = self.extract_company_name(result)
            if not name or len(name) < 2:
                return None
            
            # Extract other company details
            industry = self.extract_industry(result, criteria)
            employee_count = self.extract_employee_count(result)
            employee_range = self.format_employee_range(employee_count)
            tools_detected = self.extract_tools(result, criteria)
            location = self.extract_location(result)
            founded = self.extract_founded_year(result)
            company_type = self.extract_company_type(result, criteria)
            
            # Calculate confidence and match reasons
            confidence_data = self.calculate_confidence_and_reasons(
                name, result, criteria, tools_detected, employee_count, industry
            )
            
            # Apply minimum confidence threshold
            if confidence_data['confidence'] < 30:
                return None
            
            # Create company object
            company = Company(
                name=name,
                industry=industry or "Technology",
                company_type=company_type,
                employee_count=employee_count,
                employee_range=employee_range,
                website=result.get('url', ''),
                description=self.create_description(result),
                tools_detected=tools_detected,
                location=location,
                founded=founded,
                confidence_score=confidence_data['confidence'],
                match_reasons=confidence_data['reasons'],
                search_source=result.get('search_strategy', 'Web Search'),
                additional_data={
                    'target_source': result.get('target_source', ''),
                    'strategy_reasoning': result.get('strategy_reasoning', '')
                }
            )
            
            return company
            
        except Exception as e:
            logger.error(f"Company extraction error: {e}")
            return None
    
    def should_skip_result(self, result: Dict[str, Any]) -> bool:
        """Determine if we should skip this result"""
        
        url = result.get('url', '').lower()
        title = result.get('title', '').lower()
        
        # Skip individual profile pages
        skip_patterns = [
            'linkedin.com/in/',  # Individual LinkedIn profiles
            'twitter.com/',      # Individual Twitter profiles
            'facebook.com/',     # Individual Facebook profiles
            'github.com/' + r'[^/]+/?$',  # Individual GitHub profiles (not orgs)
            'indeed.com/cmp/',   # Individual company reviews
            'glassdoor.com/Reviews/',  # Individual reviews
        ]
        
        for pattern in skip_patterns:
            if re.search(pattern, url):
                return True
        
        # Skip results that look like individual employee content
        employee_indicators = [
            'profile', 'resume', 'cv', 'biography', 'about me',
            'personal', 'individual', 'employee of', 'works at'
        ]
        
        if any(indicator in title for indicator in employee_indicators):
            return True
        
        return False
    
    def extract_company_name(self, result: Dict[str, Any]) -> Optional[str]:
        """Extract company name from result"""
        
        title = result.get('title', '')
        url = result.get('url', '')
        
        # Handle different URL patterns
        if 'linkedin.com/company/' in url:
            # Extract from LinkedIn company URL
            match = re.search(r'linkedin\.com/company/([^/?]+)', url)
            if match:
                company_slug = match.group(1)
                return company_slug.replace('-', ' ').title()
        
        elif 'crunchbase.com/organization/' in url:
            # Extract from Crunchbase URL
            match = re.search(r'crunchbase\.com/organization/([^/?]+)', url)
            if match:
                company_slug = match.group(1)
                return company_slug.replace('-', ' ').title()
        
        elif 'angel.co/company/' in url:
            # Extract from AngelList URL
            match = re.search(r'angel\.co/company/([^/?]+)', url)
            if match:
                company_slug = match.group(1)
                return company_slug.replace('-', ' ').title()
        
        # Clean up title for company name
        name = re.sub(r'\s*[\|\-–]\s*.*$', '', title).strip()
        name = re.sub(r'\s*\(.*\)$', '', name).strip()
        
        # Remove business suffixes
        suffixes = ['Inc', 'LLC', 'Corp', 'Corporation', 'Ltd', 'Limited', 'Company', 'Co']
        for suffix in suffixes:
            name = re.sub(rf'\b{suffix}\.?\s*$', '', name, flags=re.IGNORECASE).strip()
        
        # If title is generic, try domain
        generic_terms = ['home', 'welcome', 'about', 'careers', 'jobs']
        if any(term in name.lower() for term in generic_terms) or len(name) < 4:
            from urllib.parse import urlparse
            domain = urlparse(url).netloc.replace('www.', '').split('.')[0]
            if len(domain) > 2 and domain not in ['linkedin', 'crunchbase', 'angel', 'github']:
                return domain.replace('-', ' ').title()
        
        return name if len(name) > 2 else None
    
    def calculate_confidence_and_reasons(self, name: str, result: Dict[str, Any], criteria: SearchCriteria, 
                                       tools: List[str], employee_count: Optional[int], industry: Optional[str]) -> Dict[str, Any]:
        """Calculate confidence score and match reasons"""
        
        confidence = 40  # Base confidence
        reasons = []
        
        # Source quality bonus
        url = result.get('url', '')
        if 'crunchbase.com' in url:
            confidence += 20
            reasons.append("Found in Crunchbase database")
        elif 'linkedin.com/company' in url:
            confidence += 15
            reasons.append("Official LinkedIn company page")
        elif 'angel.co' in url or 'wellfound.com' in url:
            confidence += 12
            reasons.append("Listed on startup job platform")
        
        # Tool matching
        if criteria.required_tools and tools:
            matched_tools = [t for t in tools if any(req.lower() in t.lower() for req in criteria.required_tools)]
            if matched_tools:
                confidence += len(matched_tools) * 10
                reasons.append(f"Uses required tools: {', '.join(matched_tools)}")
        
        # Employee range matching
        if employee_count and (criteria.employee_range_min or criteria.employee_range_max):
            min_emp = criteria.employee_range_min or 0
            max_emp = criteria.employee_range_max or 1000000
            
            if min_emp <= employee_count <= max_emp:
                confidence += 15
                reasons.append(f"Employee count ({employee_count:,}) matches range")
            elif min_emp * 0.7 <= employee_count <= max_emp * 1.3:
                confidence += 8
                reasons.append(f"Employee count ({employee_count:,}) close to range")
        
        # Industry matching
        if criteria.industry and industry:
            if criteria.industry.lower() in industry.lower():
                confidence += 12
                reasons.append(f"Industry matches: {industry}")
        
        # Strategy-specific bonuses
        strategy = result.get('search_strategy', '').lower()
        if 'customer' in strategy or 'case study' in strategy:
            confidence += 10
            reasons.append("Found in customer showcase")
        elif 'directory' in strategy:
            confidence += 8
            reasons.append("Listed in industry directory")
        
        return {
            'confidence': min(confidence, 100),
            'reasons': reasons
        }
    
    def extract_employee_count(self, result: Dict[str, Any]) -> Optional[int]:
        """Extract employee count from result"""
        
        text = (result.get('title', '') + ' ' + result.get('snippet', '')).lower()
        
        patterns = [
            r'(\d{1,3}(?:,\d{3})*)\s*employees?',
            r'team\s+of\s+(\d{1,3}(?:,\d{3})*)',
            r'(\d{1,3}(?:,\d{3})*)\s*people',
            r'(\d{1,3}(?:,\d{3})*)-(\d{1,3}(?:,\d{3})*)\s*employees?'
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text)
            if matches:
                try:
                    if isinstance(matches[0], tuple):
                        min_emp = int(matches[0][0].replace(',', ''))
                        max_emp = int(matches[0][1].replace(',', ''))
                        return (min_emp + max_emp) // 2
                    else:
                        count = int(matches[0].replace(',', ''))
                        if 5 <= count <= 500000:
                            return count
                except:
                    continue
        
        return None
    
    def format_employee_range(self, count: Optional[int]) -> str:
        """Format employee count into range"""
        
        if not count:
            return "Unknown"
        
        if count < 50:
            return "1-50"
        elif count < 200:
            return "50-200"
        elif count < 500:
            return "200-500"
        elif count < 1000:
            return "500-1000"
        elif count < 5000:
            return "1000-5000"
        else:
            return "5000+"
    
    def extract_tools(self, result: Dict[str, Any], criteria: SearchCriteria) -> List[str]:
        """Extract tools from result"""
        
        text = (result.get('title', '') + ' ' + result.get('snippet', '')).lower()
        
        # Common tools with variations
        tool_patterns = {
            'salesforce': ['salesforce', 'salesforce.com', 'sfdc'],
            'hubspot': ['hubspot', 'hubspot.com'],
            'intercom': ['intercom', 'intercom.io', 'intercom.com'],
            'slack': ['slack', 'slack.com'],
            'zendesk': ['zendesk', 'zendesk.com'],
            'stripe': ['stripe', 'stripe.com'],
            'shopify': ['shopify', 'shopify.com'],
            'zoom': ['zoom', 'zoom.us'],
            'notion': ['notion', 'notion.so']
        }
        
        found_tools = []
        for tool, variations in tool_patterns.items():
            for variation in variations:
                if variation in text:
                    found_tools.append(tool)
                    break
        
        return list(set(found_tools))
    
    def extract_industry(self, result: Dict[str, Any], criteria: SearchCriteria) -> Optional[str]:
        """Extract industry from result"""
        
        if criteria.industry:
            return criteria.industry.title()
        
        text = (result.get('title', '') + ' ' + result.get('snippet', '')).lower()
        
        industries = {
            'SaaS': ['saas', 'software as a service', 'cloud software'],
            'Fintech': ['fintech', 'financial technology', 'payments'],
            'E-commerce': ['ecommerce', 'e-commerce', 'marketplace'],
            'Healthcare': ['healthcare', 'health tech', 'medical'],
            'Transportation': ['rideshare', 'transportation', 'mobility'],
            'Food Tech': ['food delivery', 'restaurant tech']
        }
        
        for industry, keywords in industries.items():
            if any(keyword in text for keyword in keywords):
                return industry
        
        return None
    
    def extract_location(self, result: Dict[str, Any]) -> Optional[str]:
        """Extract location from result"""
        
        text = result.get('snippet', '').lower()
        
        cities = [
            'san francisco', 'new york', 'los angeles', 'boston', 'seattle',
            'austin', 'chicago', 'miami', 'denver', 'atlanta', 'london',
            'toronto', 'berlin', 'paris', 'singapore'
        ]
        
        for city in cities:
            if city in text:
                return city.title()
        
        return None
    
    def extract_founded_year(self, result: Dict[str, Any]) -> Optional[str]:
        """Extract founding year from result"""
        
        text = result.get('snippet', '').lower()
        
        patterns = [
            r'founded\s+in\s+(\d{4})',
            r'established\s+(\d{4})',
            r'since\s+(\d{4})'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                year = int(match.group(1))
                if 1990 <= year <= 2024:
                    return str(year)
        
        return None
    
    def extract_company_type(self, result: Dict[str, Any], criteria: SearchCriteria) -> Optional[str]:
        """Extract company type from result"""
        
        if criteria.company_type:
            return criteria.company_type
        
        text = (result.get('title', '') + ' ' + result.get('snippet', '')).lower()
        
        if any(term in text for term in ['consumer', 'mobile app', 'customer app']):
            return "B2C"
        elif any(term in text for term in ['enterprise', 'business software', 'b2b']):
            return "B2B"
        
        return None
    
    def create_description(self, result: Dict[str, Any]) -> str:
        """Create company description from result"""
        
        snippet = result.get('snippet', '')
        description = snippet[:300] + "..." if len(snippet) > 300 else snippet
        return description or "Company found through intelligent web search."

class AICompanyResearcher:
    """Main AI-driven company research orchestrator"""
    
    def __init__(self):
        self.strategy_generator = AISearchStrategyGenerator()
        self.search_executor = IntelligentSearchExecutor()
        self.company_extractor = SmartCompanyExtractor()
        self.search_events = []
    
    def add_event(self, message: str, event_type: str = "info"):
        """Add search event"""
        event = {
            "id": f"event-{len(self.search_events) + 1}",
            "message": message,
            "type": event_type,
            "timestamp": datetime.now().strftime("%H:%M:%S")
        }
        self.search_events.append(event)
        logger.info(f"[{event_type.upper()}] {message}")
    
    async def research_companies(self, query: str) -> SearchResult:
        """Main AI-driven research method"""
        
        start_time = datetime.now()
        self.search_events = []
        
        try:
            # Parse query (simplified for now - let AI handle the complexity)
            self.add_event("🧠 AI analyzing your search requirements...", "analyzing")
            criteria = self.parse_query_simple(query)
            
            # Generate AI search strategies
            self.add_event("🎯 AI generating creative search strategies...", "analyzing") 
            strategies = await self.strategy_generator.generate_search_strategies(criteria, query)
            
            self.add_event(f"✅ Generated {len(strategies)} AI-powered search strategies", "success")
            
            # Execute search strategies
            all_results = []
            for i, strategy in enumerate(strategies):
                self.add_event(f"🔍 Executing: {strategy.get('strategy_name', f'Strategy {i+1}')}", "searching")
                
                results = await self.search_executor.execute_search_strategy(strategy)
                all_results.extend(results)
                
                if results:
                    self.add_event(f"📄 Found {len(results)} pages from this strategy", "info")
                
                # Rate limiting
                await asyncio.sleep(1.5)
            
            self.add_event(f"📊 Analyzing {len(all_results)} search results for companies...", "analyzing")
            
            # Extract companies from results
            companies = []
            for result in all_results:
                company = self.company_extractor.extract_company_from_result(result, criteria)
                if company:
                    companies.append(company)
            
            # Remove duplicates and rank
            unique_companies = self.deduplicate_companies(companies)
            final_companies = sorted(unique_companies, key=lambda x: x.confidence_score, reverse=True)[:15]
            
            execution_time = (datetime.now() - start_time).total_seconds()
            
            if final_companies:
                high_confidence = len([c for c in final_companies if c.confidence_score >= 70])
                self.add_event(f"🎉 Found {len(final_companies)} companies ({high_confidence} high confidence)", "success")
            else:
                self.add_event("❌ No companies found. AI may need to try different strategies.", "warning")
            
            # Generate table data
            table_data = self.generate_table_data(final_companies) if final_companies else None
            
            return SearchResult(
                companies=final_companies,
                search_criteria=criteria,
                total_found=len(all_results),
                criteria_matched=len(final_companies),
                search_summary=f"AI found {len(final_companies)} companies using creative search strategies",
                reasoning=f"AI generated {len(strategies)} unique search strategies and analyzed {len(all_results)} results in {execution_time:.1f}s",
                execution_time=execution_time,
                search_events=self.search_events,
                table_data=table_data
            )
            
        except Exception as e:
            execution_time = (datetime.now() - start_time).total_seconds()
            self.add_event(f"❌ Search failed: {str(e)}", "error")
            
            return SearchResult(
                companies=[],
                search_criteria=SearchCriteria(),
                total_found=0,
                criteria_matched=0,
                search_summary="AI search failed due to error",
                reasoning=f"Error occurred: {str(e)}",
                execution_time=execution_time,
                search_events=self.search_events
            )
    
    def parse_query_simple(self, query: str) -> SearchCriteria:
        """Simple query parsing - let AI handle the complexity"""
        
        criteria = SearchCriteria()
        query_lower = query.lower()
        
        # Basic extraction
        if 'b2c' in query_lower or 'consumer' in query_lower:
            criteria.company_type = "B2C"
        elif 'b2b' in query_lower or 'business' in query_lower:
            criteria.company_type = "B2B"
        
        # Extract tools
        tools = ['intercom', 'salesforce', 'hubspot', 'slack', 'stripe', 'shopify', 'zendesk']
        for tool in tools:
            if tool in query_lower:
                criteria.required_tools.append(tool)
        
        # Extract employee range
        emp_match = re.search(r'(\d+)-(\d+)\s*employees?', query_lower)
        if emp_match:
            criteria.employee_range_min = int(emp_match.group(1))
            criteria.employee_range_max = int(emp_match.group(2))
        
        # Extract company examples
        examples = ['uber', 'lyft', 'doordash', 'airbnb', 'stripe', 'toast']
        for example in examples:
            if example in query_lower:
                criteria.company_examples.append(example.capitalize())
        
        return criteria
    
    def deduplicate_companies(self, companies: List[Company]) -> List[Company]:
        """Remove duplicate companies"""
        
        seen = set()
        unique = []
        
        for company in companies:
            key = company.name.lower().strip()
            if key not in seen and len(key) > 2:
                seen.add(key)
                unique.append(company)
        
        return unique
    
    def generate_table_data(self, companies: List[Company]) -> Dict[str, Any]:
        """Generate table data for export"""
        
        columns = ["Company", "Industry", "Employees", "Tools", "Source", "Confidence", "Website"]
        
        rows = []
        for company in companies:
            row = {
                "Company": company.name,
                "Industry": company.industry,
                "Employees": f"{company.employee_count:,}" if company.employee_count else company.employee_range,
                "Tools": ", ".join(company.tools_detected) if company.tools_detected else "N/A",
                "Source": company.search_source,
                "Confidence": f"{company.confidence_score}%",
                "Website": company.website
            }
            rows.append(row)
        
        return {
            "columns": columns,
            "rows": rows,
            "total_companies": len(companies),
            "summary": f"AI-discovered {len(companies)} companies"
        }
    
    async def cleanup(self):
        """Cleanup resources"""
        await self.search_executor.close()

# Initialize AI researcher
ai_researcher = AICompanyResearcher()

@app.post("/search-companies", response_model=SearchResult)
async def search_companies(request: SearchRequest):
    """AI-driven company search endpoint"""
    try:
        result = await ai_researcher.research_companies(request.query)
        return result
    except Exception as e:
        logger.error(f"AI search failed: {e}")
        raise HTTPException(status_code=500, detail=f"AI search failed: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check"""
    return {
        "status": "healthy",
        "service": "ai-driven-company-research-agent",
        "version": "4.0.0",
        "features": {
            "ai_strategy_generation": bool(OPENAI_API_KEY),
            "creative_search": True,
            "company_focus": True,
            "smart_extraction": True
        },
        "timestamp": datetime.now().isoformat()
    }

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    await ai_researcher.cleanup()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)