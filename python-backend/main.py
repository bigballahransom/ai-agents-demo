# requirements.txt
"""
openai-agents
pydantic
fastapi
uvicorn
python-multipart
python-dotenv
aiofiles
httpx
beautifulsoup4
requests
"""

# main.py
from __future__ import annotations

import random
import asyncio
import httpx
import json
import time
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional, Union
from pydantic import BaseModel
import logging
from bs4 import BeautifulSoup
import re

from agents import (
    Agent,
    RunContextWrapper,
    Runner,
    TResponseInputItem,
    function_tool,
    handoff,
    GuardrailFunctionOutput,
    input_guardrail,
)
from agents.extensions.handoff_prompt import RECOMMENDED_PROMPT_PREFIX

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =========================
# CONTEXT
# =========================

class SalesAgentContext(BaseModel):
    """Context for sales prospecting agents."""
    campaign_id: Optional[str] = None
    company_name: Optional[str] = None
    target_tools: List[str] = []
    job_titles: List[str] = []
    department: Optional[str] = None
    search_results: List[Dict[str, Any]] = []
    prospects_found: int = 0
    total_searched: int = 0

def create_initial_context() -> SalesAgentContext:
    """Factory for a new SalesAgentContext."""
    return SalesAgentContext()

# =========================
# TOOLS
# =========================

@function_tool(
    name_override="web_search_tool",
    description_override="Search the web for specific information about people and companies."
)
async def web_search_tool(
    context: RunContextWrapper[SalesAgentContext],
    query: str,
    max_results: int = 10
) -> str:
    """Search the web using DuckDuckGo API."""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # DuckDuckGo Instant Answer API
            url = "https://api.duckduckgo.com/"
            params = {
                "q": query,
                "format": "json",
                "no_html": "1",
                "skip_disambig": "1"
            }
            
            response = await client.get(url, params=params)
            data = response.json()
            
            results = []
            
            # Add instant answer if available
            if data.get("Abstract"):
                results.append({
                    "title": data.get("Heading", "Search Result"),
                    "url": data.get("AbstractURL", ""),
                    "snippet": data.get("Abstract", ""),
                    "domain": "duckduckgo.com"
                })
            
            # Add related topics
            for topic in data.get("RelatedTopics", [])[:max_results]:
                if isinstance(topic, dict) and topic.get("Text"):
                    results.append({
                        "title": topic.get("Text", "").split(" - ")[0],
                        "url": topic.get("FirstURL", ""),
                        "snippet": topic.get("Text", ""),
                        "domain": extract_domain(topic.get("FirstURL", ""))
                    })
            
            # Store results in context
            context.context.search_results.extend(results)
            
            return f"Found {len(results)} search results for query: '{query}'. Results include: " + "; ".join([r["title"] for r in results[:3]])
            
    except Exception as e:
        logger.error(f"Web search error: {e}")
        return f"Error performing web search: {str(e)}"

@function_tool(
    name_override="linkedin_search_tool",
    description_override="Search for LinkedIn profiles of specific people at companies."
)
async def linkedin_search_tool(
    context: RunContextWrapper[SalesAgentContext],
    company_name: str,
    job_title: str,
    additional_keywords: str = ""
) -> str:
    """Search for LinkedIn profiles with specific criteria."""
    try:
        query = f'site:linkedin.com/in "{company_name}" "{job_title}" {additional_keywords}'
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            url = "https://api.duckduckgo.com/"
            params = {
                "q": query,
                "format": "json",
                "no_html": "1",
                "skip_disambig": "1"
            }
            
            response = await client.get(url, params=params)
            data = response.json()
            
            linkedin_profiles = []
            
            # Filter for LinkedIn profile URLs
            for topic in data.get("RelatedTopics", []):
                if isinstance(topic, dict) and topic.get("FirstURL"):
                    url = topic.get("FirstURL", "")
                    if "linkedin.com/in" in url:
                        linkedin_profiles.append({
                            "name": extract_name_from_linkedin_text(topic.get("Text", "")),
                            "title": job_title,
                            "company": company_name,
                            "url": url,
                            "snippet": topic.get("Text", "")
                        })
            
            # Store profiles in context
            context.context.search_results.extend(linkedin_profiles)
            context.context.total_searched += len(linkedin_profiles)
            
            return f"Found {len(linkedin_profiles)} LinkedIn profiles for {job_title} at {company_name}. Profiles: " + "; ".join([p["name"] for p in linkedin_profiles[:5]])
            
    except Exception as e:
        logger.error(f"LinkedIn search error: {e}")
        return f"Error searching LinkedIn: {str(e)}"

@function_tool(
    name_override="analyze_profile_tool",
    description_override="Analyze a LinkedIn profile to detect tools and technologies mentioned."
)
async def analyze_profile_tool(
    context: RunContextWrapper[SalesAgentContext],
    profile_url: str,
    target_tools: List[str]
) -> str:
    """Analyze a LinkedIn profile for tool mentions."""
    try:
        # Simulate profile analysis (in production, you'd scrape or use LinkedIn API)
        tools_found = []
        confidence_score = 0.0
        
        # Mock analysis based on URL and target tools
        profile_content = await scrape_profile_content(profile_url)
        
        if profile_content:
            tools_found = detect_tools_in_content(profile_content, target_tools)
            confidence_score = calculate_confidence_score(tools_found, target_tools, profile_content)
            
            if tools_found:
                context.context.prospects_found += 1
        
        return f"Analyzed profile {profile_url}. Found tools: {', '.join(tools_found)}. Confidence: {confidence_score}%"
        
    except Exception as e:
        logger.error(f"Profile analysis error: {e}")
        return f"Error analyzing profile: {str(e)}"

@function_tool(
    name_override="company_research_tool",
    description_override="Research a company to understand their tech stack and tools."
)
async def company_research_tool(
    context: RunContextWrapper[SalesAgentContext],
    company_name: str
) -> str:
    """Research a company's technology stack and tools."""
    try:
        # Search for company + technology keywords
        tech_keywords = ["technology stack", "tools", "software", "platform", "integration", "CRM", "sales tools"]
        
        results = []
        for keyword in tech_keywords[:3]:  # Limit searches
            query = f'"{company_name}" {keyword}'
            search_result = await web_search_tool(context, query, max_results=3)
            results.append(search_result)
        
        return f"Researched {company_name} technology usage. Found information about their tech stack and tools."
        
    except Exception as e:
        logger.error(f"Company research error: {e}")
        return f"Error researching company: {str(e)}"

# =========================
# HELPER FUNCTIONS
# =========================

def extract_domain(url: str) -> str:
    """Extract domain from URL."""
    try:
        from urllib.parse import urlparse
        return urlparse(url).netloc
    except:
        return ""

def extract_name_from_linkedin_text(text: str) -> str:
    """Extract person's name from LinkedIn search result text."""
    # Simple extraction - in production, use more sophisticated parsing
    parts = text.split(" - ")
    if parts:
        return parts[0].strip()
    return "Unknown"

async def scrape_profile_content(url: str) -> Optional[str]:
    """Scrape profile content (simplified version)."""
    try:
        # Mock content for demonstration
        mock_contents = [
            "Salesforce certified professional with 5 years experience in CRM implementation and sales automation.",
            "HubSpot expert specializing in inbound marketing and lead generation strategies.",
            "Experienced sales manager with expertise in Pipedrive, Outreach, and sales engagement platforms.",
            "Technology leader with experience in Python, Docker, AWS, and cloud infrastructure.",
            "Marketing professional skilled in Google Analytics, Facebook Ads, and marketing automation tools."
        ]
        
        # Simulate some processing time
        await asyncio.sleep(0.5)
        
        return random.choice(mock_contents)
        
    except Exception as e:
        logger.error(f"Scraping error for {url}: {e}")
        return None

def detect_tools_in_content(content: str, target_tools: List[str]) -> List[str]:
    """Detect tools mentioned in content."""
    found_tools = []
    content_lower = content.lower()
    
    # Enhanced tool detection with variations
    tool_variations = {
        "salesforce": ["salesforce", "sfdc", "sales cloud", "service cloud", "trailhead"],
        "hubspot": ["hubspot", "hub spot", "inbound marketing"],
        "pipedrive": ["pipedrive", "pipe drive"],
        "outreach": ["outreach.io", "outreach", "sales engagement"],
        "apollo": ["apollo.io", "apollo"],
        "python": ["python", "django", "flask"],
        "docker": ["docker", "containerization"],
        "aws": ["aws", "amazon web services", "ec2", "s3"],
        "google": ["google analytics", "google ads", "adwords"]
    }
    
    for tool in target_tools:
        tool_lower = tool.lower()
        
        # Check exact match
        if tool_lower in content_lower:
            found_tools.append(tool)
            continue
        
        # Check variations
        if tool_lower in tool_variations:
            for variation in tool_variations[tool_lower]:
                if variation in content_lower:
                    found_tools.append(tool)
                    break
    
    return list(set(found_tools))

def calculate_confidence_score(tools_found: List[str], target_tools: List[str], content: str) -> float:
    """Calculate confidence score based on analysis."""
    if not target_tools:
        return 0.0
    
    match_ratio = len(tools_found) / len(target_tools)
    base_score = match_ratio * 70
    
    # Bonus for quality indicators
    quality_indicators = ["certified", "expert", "experience", "specialist", "years"]
    bonus = sum(10 for indicator in quality_indicators if indicator in content.lower())
    
    return min(base_score + bonus, 100)

# =========================
# AGENTS
# =========================

def web_search_instructions(
    run_context: RunContextWrapper[SalesAgentContext], agent: Agent[SalesAgentContext]
) -> str:
    return (
        f"{RECOMMENDED_PROMPT_PREFIX}\n"
        "You are a web search specialist agent for sales prospecting. Your role is to:\n"
        "1. Search the web for information about companies and people\n"
        "2. Find relevant profiles and contact information\n"
        "3. Gather intelligence about technology usage\n"
        "Use the web_search_tool to find general information and the linkedin_search_tool for finding specific people.\n"
        "Always provide clear, actionable results about what you found."
    )

web_search_agent = Agent[SalesAgentContext](
    name="Web Search Agent",
    model="gpt-4",
    handoff_description="A specialist agent that searches the web for prospect information.",
    instructions=web_search_instructions,
    tools=[web_search_tool, linkedin_search_tool, company_research_tool],
)

def linkedin_analysis_instructions(
    run_context: RunContextWrapper[SalesAgentContext], agent: Agent[SalesAgentContext]
) -> str:
    ctx = run_context.context
    target_tools = ", ".join(ctx.target_tools) if ctx.target_tools else "various tools"
    return (
        f"{RECOMMENDED_PROMPT_PREFIX}\n"
        "You are a LinkedIn profile analysis specialist. Your role is to:\n"
        "1. Analyze LinkedIn profiles for technology and tool mentions\n"
        "2. Look for specific tools like: {target_tools}\n"
        "3. Assess the likelihood that the person uses the target technologies\n"
        "4. Provide confidence scores based on evidence found\n"
        "Use the analyze_profile_tool to examine profiles and detect tool usage patterns."
    )

linkedin_analysis_agent = Agent[SalesAgentContext](
    name="LinkedIn Analysis Agent",
    model="gpt-4",
    handoff_description="Specialist in analyzing LinkedIn profiles for tool usage.",
    instructions=linkedin_analysis_instructions,
    tools=[analyze_profile_tool],
)

def prospect_coordinator_instructions(
    run_context: RunContextWrapper[SalesAgentContext], agent: Agent[SalesAgentContext]
) -> str:
    return (
        f"{RECOMMENDED_PROMPT_PREFIX}\n"
        "You are the main coordinator for sales prospecting campaigns. Your role is to:\n"
        "1. Understand the prospect search requirements\n"
        "2. Coordinate with search and analysis agents\n"
        "3. Provide updates on campaign progress\n"
        "4. Summarize findings and results\n"
        "Delegate specific tasks to the Web Search Agent for finding prospects and LinkedIn Analysis Agent for profile analysis."
    )

prospect_coordinator_agent = Agent[SalesAgentContext](
    name="Prospect Coordinator",
    model="gpt-4",
    handoff_description="Main coordinator for sales prospecting campaigns.",
    instructions=prospect_coordinator_instructions,
    handoffs=[web_search_agent, linkedin_analysis_agent],
)

# Set up agent relationships
web_search_agent.handoffs.append(linkedin_analysis_agent)
web_search_agent.handoffs.append(prospect_coordinator_agent)
linkedin_analysis_agent.handoffs.append(web_search_agent)
linkedin_analysis_agent.handoffs.append(prospect_coordinator_agent)

# =========================
# FastAPI Integration
# =========================

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel as PydanticBaseModel, Field

app = FastAPI(title="Sales Agent API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Models
class CampaignRequest(PydanticBaseModel):
    company_name: str = Field(..., description="Target company name")
    job_titles: List[str] = Field(..., description="Job titles to search for")
    target_tools: List[str] = Field(..., description="Tools/technologies to detect")
    department: Optional[str] = Field(None, description="Department focus")

class ChatRequest(PydanticBaseModel):
    campaign_id: Optional[str] = None
    message: str

class AgentResponse(PydanticBaseModel):
    campaign_id: str
    response: str
    context: Dict[str, Any]
    agent: str

# In-memory storage
campaigns: Dict[str, Dict[str, Any]] = {}
campaign_contexts: Dict[str, SalesAgentContext] = {}

@app.get("/")
async def root():
    return {"message": "Sales Agent API with OpenAI Agents is running"}

@app.post("/campaigns", response_model=AgentResponse)
async def create_campaign(request: CampaignRequest):
    """Create a new sales prospecting campaign."""
    campaign_id = str(uuid.uuid4())
    
    # Create context
    context = create_initial_context()
    context.campaign_id = campaign_id
    context.company_name = request.company_name
    context.target_tools = request.target_tools
    context.job_titles = request.job_titles
    context.department = request.department
    
    # Store context
    campaign_contexts[campaign_id] = context
    
    # Create campaign entry
    campaigns[campaign_id] = {
        "id": campaign_id,
        "name": f"{request.company_name} - {', '.join(request.job_titles)}",
        "status": "created",
        "created_at": datetime.now().isoformat(),
        "request": request.dict()
    }
    
    # Start with coordinator agent
    initial_message = f"Start a new prospecting campaign for {request.company_name}. " + \
                     f"Find people with job titles: {', '.join(request.job_titles)}. " + \
                     f"Focus on detecting these tools: {', '.join(request.target_tools)}."
    
    result = await Runner.run(
        prospect_coordinator_agent,
        [{"role": "user", "content": initial_message}],
        context=context
    )
    
    # Extract response
    response_text = ""
    for item in result.new_items:
        if hasattr(item, 'text'):
            response_text += item.text + " "
    
    return AgentResponse(
        campaign_id=campaign_id,
        response=response_text.strip(),
        context=context.dict(),
        agent=prospect_coordinator_agent.name
    )

@app.post("/campaigns/{campaign_id}/chat", response_model=AgentResponse)
async def chat_with_agent(campaign_id: str, request: ChatRequest):
    """Continue conversation with the sales agent."""
    if campaign_id not in campaign_contexts:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    context = campaign_contexts[campaign_id]
    
    # Run with coordinator agent
    result = await Runner.run(
        prospect_coordinator_agent,
        [{"role": "user", "content": request.message}],
        context=context
    )
    
    # Extract response
    response_text = ""
    current_agent = prospect_coordinator_agent.name
    
    for item in result.new_items:
        if hasattr(item, 'text'):
            response_text += item.text + " "
        if hasattr(item, 'agent'):
            current_agent = item.agent.name
    
    # Update stored context
    campaign_contexts[campaign_id] = context
    
    return AgentResponse(
        campaign_id=campaign_id,
        response=response_text.strip(),
        context=context.dict(),
        agent=current_agent
    )

@app.get("/campaigns/{campaign_id}")
async def get_campaign(campaign_id: str):
    """Get campaign details."""
    if campaign_id not in campaigns:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    campaign = campaigns[campaign_id]
    context = campaign_contexts.get(campaign_id)
    
    if context:
        campaign["progress"] = {
            "prospects_found": context.prospects_found,
            "total_searched": context.total_searched,
            "search_results": len(context.search_results)
        }
    
    return campaign

@app.get("/campaigns")
async def list_campaigns():
    """List all campaigns."""
    return {"campaigns": list(campaigns.values())}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)