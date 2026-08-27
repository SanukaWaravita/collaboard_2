import {
  PROJECT_ROLES,
  PROJECT_VISIBILITY,
  WORKSPACE_ROLES,
} from "../constants/access.js";
import { createDefaultWorkflowStatuses } from "../utils/workflowStatuses.js";

const COMPANY_USER_IDS = Object.freeze({
  REPRESENTATIVE: "company-user-representative",
  PRODUCT_LEAD: "company-user-product-lead",
  MARKETING_LEAD: "company-user-marketing-lead",
  SALES_LEAD: "company-user-sales-lead",
  CUSTOMER_SUCCESS_LEAD: "company-user-customer-success-lead",
  PEOPLE_LEAD: "company-user-people-lead",
  OPERATIONS_LEAD: "company-user-operations-lead",
});

const COMPANY_WORKSPACE_DEFINITIONS = [
  {
    id: "aurora-product-engineering",
    name: "Product & Engineering",
    slug: "aurora-product-engineering",
    leadUserId: COMPANY_USER_IDS.PRODUCT_LEAD,
  },

  {
    id: "aurora-marketing-growth",
    name: "Marketing & Growth",
    slug: "aurora-marketing-growth",
    leadUserId: COMPANY_USER_IDS.MARKETING_LEAD,
  },

  {
    id: "aurora-sales-partnerships",
    name: "Sales & Partnerships",
    slug: "aurora-sales-partnerships",
    leadUserId: COMPANY_USER_IDS.SALES_LEAD,
  },

  {
    id: "aurora-customer-success",
    name: "Customer Success",
    slug: "aurora-customer-success",
    leadUserId: COMPANY_USER_IDS.CUSTOMER_SUCCESS_LEAD,
  },

  {
    id: "aurora-people-culture",
    name: "People & Culture",
    slug: "aurora-people-culture",
    leadUserId: COMPANY_USER_IDS.PEOPLE_LEAD,
  },

  {
    id: "aurora-finance-operations",
    name: "Finance & Operations",
    slug: "aurora-finance-operations",
    leadUserId: COMPANY_USER_IDS.OPERATIONS_LEAD,
  },
];

const COMPANY_PROJECT_IDS = Object.freeze({
  CUSTOMER_PORTAL: "aurora-project-customer-portal",
  MOBILE_APPLICATION: "aurora-project-mobile-application",
  PLATFORM_RELIABILITY: "aurora-project-platform-reliability",

  BRAND_REFRESH: "aurora-project-brand-refresh",
  GROWTH_CAMPAIGN: "aurora-project-growth-campaign",
  CONTENT_STRATEGY: "aurora-project-content-strategy",

  ENTERPRISE_PIPELINE: "aurora-project-enterprise-pipeline",
  PARTNER_ENABLEMENT: "aurora-project-partner-enablement",
  CRM_DATA_QUALITY: "aurora-project-crm-data-quality",

  CLIENT_ONBOARDING: "aurora-project-client-onboarding",
  HELP_CENTRE: "aurora-project-help-centre",
  RENEWAL_HEALTH: "aurora-project-renewal-health",

  GRADUATE_RECRUITMENT: "aurora-project-graduate-recruitment",
  MANAGER_DEVELOPMENT: "aurora-project-manager-development",
  HYBRID_WORK: "aurora-project-hybrid-work",

  BUDGET_PLANNING: "aurora-project-budget-planning",
  PROCUREMENT_REVIEW: "aurora-project-procurement-review",
  OFFICE_EXPANSION: "aurora-project-office-expansion",
});

const COMPANY_PROJECT_DEFINITIONS = [
  // Product & Engineering

  {
    id: COMPANY_PROJECT_IDS.CUSTOMER_PORTAL,
    workspaceId: "aurora-product-engineering",
    projectKey: "CPV2",
    name: "Customer Portal v2",
    description:
      "Redesign and deliver the next version of the customer self-service portal.",
    visibility: PROJECT_VISIBILITY.OPEN,
  },

  {
    id: COMPANY_PROJECT_IDS.MOBILE_APPLICATION,
    workspaceId: "aurora-product-engineering",
    projectKey: "MOB21",
    name: "Mobile Application 2.1",
    description:
      "Prepare the next mobile release with performance and usability improvements.",
    visibility: PROJECT_VISIBILITY.PRIVATE,
  },

  {
    id: COMPANY_PROJECT_IDS.PLATFORM_RELIABILITY,
    workspaceId: "aurora-product-engineering",
    projectKey: "SRE",
    name: "Platform Reliability",
    description:
      "Improve monitoring, incident response and production-platform resilience.",
    visibility: PROJECT_VISIBILITY.PRIVATE,
  },

  // Marketing & Growth

  {
    id: COMPANY_PROJECT_IDS.BRAND_REFRESH,
    workspaceId: "aurora-marketing-growth",
    projectKey: "BRAND",
    name: "Brand Refresh",
    description:
      "Refresh Aurora's visual identity and coordinate its company-wide rollout.",
    visibility: PROJECT_VISIBILITY.OPEN,
  },

  {
    id: COMPANY_PROJECT_IDS.GROWTH_CAMPAIGN,
    workspaceId: "aurora-marketing-growth",
    projectKey: "Q4G",
    name: "Q4 Growth Campaign",
    description:
      "Plan and execute a multi-channel campaign for the fourth-quarter pipeline.",
    visibility: PROJECT_VISIBILITY.PRIVATE,
  },

  {
    id: COMPANY_PROJECT_IDS.CONTENT_STRATEGY,
    workspaceId: "aurora-marketing-growth",
    projectKey: "CONTENT",
    name: "Content Strategy",
    description:
      "Build a repeatable editorial programme for product and industry content.",
    visibility: PROJECT_VISIBILITY.OPEN,
  },

  // Sales & Partnerships

  {
    id: COMPANY_PROJECT_IDS.ENTERPRISE_PIPELINE,
    workspaceId: "aurora-sales-partnerships",
    projectKey: "ENT",
    name: "Enterprise Pipeline",
    description:
      "Coordinate priority enterprise opportunities and upcoming deal milestones.",
    visibility: PROJECT_VISIBILITY.PRIVATE,
  },

  {
    id: COMPANY_PROJECT_IDS.PARTNER_ENABLEMENT,
    workspaceId: "aurora-sales-partnerships",
    projectKey: "PARTNER",
    name: "Partner Enablement",
    description:
      "Prepare onboarding, training and sales materials for channel partners.",
    visibility: PROJECT_VISIBILITY.OPEN,
  },

  {
    id: COMPANY_PROJECT_IDS.CRM_DATA_QUALITY,
    workspaceId: "aurora-sales-partnerships",
    projectKey: "CRM",
    name: "CRM Data Quality",
    description:
      "Standardize account data and improve the reliability of pipeline reporting.",
    visibility: PROJECT_VISIBILITY.PRIVATE,
  },

  // Customer Success

  {
    id: COMPANY_PROJECT_IDS.CLIENT_ONBOARDING,
    workspaceId: "aurora-customer-success",
    projectKey: "ONBOARD",
    name: "Client Onboarding Revamp",
    description:
      "Reduce time-to-value by redesigning the customer onboarding journey.",
    visibility: PROJECT_VISIBILITY.OPEN,
  },

  {
    id: COMPANY_PROJECT_IDS.HELP_CENTRE,
    workspaceId: "aurora-customer-success",
    projectKey: "HELP",
    name: "Help Centre Refresh",
    description:
      "Audit and improve customer-facing product guidance and support articles.",
    visibility: PROJECT_VISIBILITY.OPEN,
  },

  {
    id: COMPANY_PROJECT_IDS.RENEWAL_HEALTH,
    workspaceId: "aurora-customer-success",
    projectKey: "RENEW",
    name: "Renewal Health Programme",
    description:
      "Identify renewal risks and coordinate proactive customer-success actions.",
    visibility: PROJECT_VISIBILITY.PRIVATE,
  },

  // People & Culture

  {
    id: COMPANY_PROJECT_IDS.GRADUATE_RECRUITMENT,
    workspaceId: "aurora-people-culture",
    projectKey: "GRAD27",
    name: "2027 Graduate Recruitment",
    description:
      "Plan university outreach, candidate assessment and graduate onboarding.",
    visibility: PROJECT_VISIBILITY.PRIVATE,
  },

  {
    id: COMPANY_PROJECT_IDS.MANAGER_DEVELOPMENT,
    workspaceId: "aurora-people-culture",
    projectKey: "MGRDEV",
    name: "Manager Development",
    description:
      "Create a structured development programme for new and existing managers.",
    visibility: PROJECT_VISIBILITY.PRIVATE,
  },

  {
    id: COMPANY_PROJECT_IDS.HYBRID_WORK,
    workspaceId: "aurora-people-culture",
    projectKey: "HYBRID",
    name: "Hybrid Work Handbook",
    description:
      "Document practical guidelines for effective and inclusive hybrid work.",
    visibility: PROJECT_VISIBILITY.OPEN,
  },

  // Finance & Operations

  {
    id: COMPANY_PROJECT_IDS.BUDGET_PLANNING,
    workspaceId: "aurora-finance-operations",
    projectKey: "FY27",
    name: "FY2027 Budget Planning",
    description:
      "Prepare departmental forecasts and consolidate the annual operating budget.",
    visibility: PROJECT_VISIBILITY.PRIVATE,
  },

  {
    id: COMPANY_PROJECT_IDS.PROCUREMENT_REVIEW,
    workspaceId: "aurora-finance-operations",
    projectKey: "PROCURE",
    name: "Procurement Review",
    description:
      "Review major suppliers, renewal dates and cost-optimization opportunities.",
    visibility: PROJECT_VISIBILITY.PRIVATE,
  },

  {
    id: COMPANY_PROJECT_IDS.OFFICE_EXPANSION,
    workspaceId: "aurora-finance-operations",
    projectKey: "OFFICE",
    name: "Office Expansion",
    description:
      "Coordinate the planning and delivery of additional office capacity.",
    visibility: PROJECT_VISIBILITY.PRIVATE,
  },
];

function defineCompanyTask(
  id,
  title,
  description,
  status,
  dueDateKey,
  assignees,
) {
  return {
    id,
    title,
    description,
    status,
    dueDateKey,
    assignees,
  };
}

const COMPANY_TASK_GROUPS = [
  // Product & Engineering

  {
    projectId: COMPANY_PROJECT_IDS.CUSTOMER_PORTAL,

    tasks: [
      defineCompanyTask(
        "cpv2-confirm-requirements",
        "Confirm customer requirements",
        "Validate the portal requirements with Customer Success and key customer representatives.",
        "done",
        "twoWeeksAgo",
        ["lead"],
      ),

      defineCompanyTask(
        "cpv2-approve-wireframes",
        "Approve portal wireframes",
        "Review the account, billing and support flows before implementation begins.",
        "done",
        "oneWeekAgo",
        ["representative", "lead"],
      ),

      defineCompanyTask(
        "cpv2-account-dashboard",
        "Implement account dashboard",
        "Build the dashboard summary for subscriptions, invoices and service activity.",
        "doing",
        "today",
        ["lead"],
      ),

      defineCompanyTask(
        "cpv2-billing-api",
        "Integrate billing history API",
        "Connect the portal interface to the customer billing-history endpoint.",
        "doing",
        "inThreeDays",
        ["lead"],
      ),

      defineCompanyTask(
        "cpv2-release-checklist",
        "Prepare release checklist",
        "Document production, support and communication requirements for the portal release.",
        "todo",
        "nextWeek",
        ["representative"],
      ),
    ],
  },

  {
    projectId: COMPANY_PROJECT_IDS.MOBILE_APPLICATION,

    tasks: [
      defineCompanyTask(
        "mobile-crash-analytics",
        "Review crash analytics",
        "Analyse recent mobile crashes and identify the highest-impact stability issues.",
        "done",
        "tenDaysAgo",
        ["lead"],
      ),

      defineCompanyTask(
        "mobile-startup-performance",
        "Optimize application startup time",
        "Reduce unnecessary startup requests and improve initial rendering performance.",
        "doing",
        "tomorrow",
        ["lead"],
      ),

      defineCompanyTask(
        "mobile-biometric-signin",
        "Add biometric sign-in",
        "Implement supported fingerprint and facial-authentication login flows.",
        "doing",
        "inFourDays",
        ["representative", "lead"],
      ),

      defineCompanyTask(
        "mobile-device-testing",
        "Complete device compatibility testing",
        "Test the release candidate across supported Android and iOS devices.",
        "todo",
        "inFiveDays",
        ["lead"],
      ),

      defineCompanyTask(
        "mobile-release-candidate",
        "Submit release candidate",
        "Prepare store metadata and submit the approved application build.",
        "todo",
        "nextWeek",
        ["representative"],
      ),
    ],
  },

  {
    projectId: COMPANY_PROJECT_IDS.PLATFORM_RELIABILITY,

    tasks: [
      defineCompanyTask(
        "sre-alert-audit",
        "Audit production alerts",
        "Remove noisy alerts and verify that critical service failures remain covered.",
        "done",
        "oneWeekAgo",
        ["lead"],
      ),

      defineCompanyTask(
        "sre-service-objectives",
        "Define service objectives",
        "Agree on availability and response-time targets for customer-facing services.",
        "done",
        "yesterday",
        ["representative", "lead"],
      ),

      defineCompanyTask(
        "sre-latency-dashboard",
        "Configure API latency dashboard",
        "Create a dashboard showing latency percentiles for production API endpoints.",
        "doing",
        "today",
        ["lead"],
      ),

      defineCompanyTask(
        "sre-backup-restoration",
        "Test database backup restoration",
        "Restore the latest backup in an isolated environment and verify its integrity.",
        "todo",
        "overdue",
        ["lead"],
      ),

      defineCompanyTask(
        "sre-incident-drill",
        "Prepare incident-response drill",
        "Design a simulated outage to test escalation and communication procedures.",
        "todo",
        "nextWeek",
        [],
      ),
    ],
  },

  // Marketing & Growth

  {
    projectId: COMPANY_PROJECT_IDS.BRAND_REFRESH,

    tasks: [
      defineCompanyTask(
        "brand-asset-audit",
        "Audit current brand assets",
        "Catalogue existing logos, templates and digital assets requiring updates.",
        "done",
        "twoWeeksAgo",
        ["lead"],
      ),

      defineCompanyTask(
        "brand-colour-palette",
        "Approve new colour palette",
        "Confirm the primary, secondary and accessibility colour combinations.",
        "done",
        "oneWeekAgo",
        ["representative", "lead"],
      ),

      defineCompanyTask(
        "brand-presentation-templates",
        "Update presentation templates",
        "Apply the refreshed visual identity to internal and customer-facing decks.",
        "doing",
        "inTwoDays",
        ["lead"],
      ),

      defineCompanyTask(
        "brand-launch-guide",
        "Prepare internal launch guide",
        "Explain how employees should use the refreshed brand and templates.",
        "todo",
        "inFiveDays",
        ["representative"],
      ),

      defineCompanyTask(
        "brand-website-assets",
        "Coordinate website asset replacement",
        "Replace outdated brand assets across the public company website.",
        "todo",
        "nextWeek",
        ["lead"],
      ),
    ],
  },

  {
    projectId: COMPANY_PROJECT_IDS.GROWTH_CAMPAIGN,

    tasks: [
      defineCompanyTask(
        "growth-campaign-audience",
        "Confirm campaign audience",
        "Define priority industries, company sizes and decision-maker profiles.",
        "done",
        "tenDaysAgo",
        ["representative", "lead"],
      ),

      defineCompanyTask(
        "growth-campaign-budget",
        "Finalize campaign budget",
        "Approve the planned spending allocation across campaign channels.",
        "doing",
        "today",
        ["representative"],
      ),

      defineCompanyTask(
        "growth-paid-media-assets",
        "Prepare paid-media assets",
        "Produce advertising copy and creative assets for the selected channels.",
        "doing",
        "inThreeDays",
        ["lead"],
      ),

      defineCompanyTask(
        "growth-conversion-tracking",
        "Configure conversion tracking",
        "Verify campaign parameters, form events and attribution reporting.",
        "todo",
        "tomorrow",
        ["lead"],
      ),

      defineCompanyTask(
        "growth-performance-review",
        "Schedule campaign performance review",
        "Arrange the first cross-functional review of campaign results.",
        "todo",
        "nextWeek",
        [],
      ),
    ],
  },

  {
    projectId: COMPANY_PROJECT_IDS.CONTENT_STRATEGY,

    tasks: [
      defineCompanyTask(
        "content-performance-analysis",
        "Analyse content performance",
        "Review traffic, engagement and conversion results from recent content.",
        "done",
        "oneWeekAgo",
        ["lead"],
      ),

      defineCompanyTask(
        "content-quarterly-themes",
        "Define quarterly content themes",
        "Agree on themes supporting product, customer and industry priorities.",
        "done",
        "yesterday",
        ["representative", "lead"],
      ),

      defineCompanyTask(
        "content-launch-article",
        "Draft product-launch article",
        "Prepare the main article supporting the upcoming product release.",
        "doing",
        "inTwoDays",
        ["lead"],
      ),

      defineCompanyTask(
        "content-expert-interviews",
        "Interview subject-matter experts",
        "Collect technical and industry insights for the next article series.",
        "todo",
        "inFourDays",
        ["representative"],
      ),

      defineCompanyTask(
        "content-editorial-calendar",
        "Build editorial calendar",
        "Schedule planned articles, customer stories and campaign content.",
        "todo",
        "nextWeek",
        ["lead"],
      ),
    ],
  },

  // Sales & Partnerships

  {
    projectId: COMPANY_PROJECT_IDS.ENTERPRISE_PIPELINE,

    tasks: [
      defineCompanyTask(
        "enterprise-qualify-accounts",
        "Qualify priority accounts",
        "Review strategic fit, expected value and buying readiness for target accounts.",
        "done",
        "twoWeeksAgo",
        ["lead"],
      ),

      defineCompanyTask(
        "enterprise-opportunity-owners",
        "Confirm opportunity owners",
        "Assign responsibility for each priority enterprise opportunity.",
        "done",
        "oneWeekAgo",
        ["representative", "lead"],
      ),

      defineCompanyTask(
        "enterprise-briefing-packs",
        "Prepare executive briefing packs",
        "Summarize customer context, stakeholders and commercial objectives.",
        "doing",
        "today",
        ["lead"],
      ),

      defineCompanyTask(
        "enterprise-security-reviews",
        "Review security questionnaires",
        "Coordinate responses to outstanding enterprise security assessments.",
        "todo",
        "overdue",
        ["representative"],
      ),

      defineCompanyTask(
        "enterprise-strategy-sessions",
        "Schedule deal-strategy sessions",
        "Arrange internal reviews for opportunities approaching decision stages.",
        "todo",
        "inThreeDays",
        ["lead"],
      ),
    ],
  },

  {
    projectId: COMPANY_PROJECT_IDS.PARTNER_ENABLEMENT,

    tasks: [
      defineCompanyTask(
        "partner-onboarding-guide",
        "Finalize partner onboarding guide",
        "Document commercial, product and support steps for new partners.",
        "done",
        "tenDaysAgo",
        ["lead"],
      ),

      defineCompanyTask(
        "partner-product-demo",
        "Record product demonstration",
        "Produce a reusable product walkthrough for partner sales teams.",
        "doing",
        "tomorrow",
        ["lead"],
      ),

      defineCompanyTask(
        "partner-certification-quiz",
        "Prepare certification quiz",
        "Create a short assessment covering positioning and product capabilities.",
        "doing",
        "inFourDays",
        ["representative", "lead"],
      ),

      defineCompanyTask(
        "partner-coselling-playbook",
        "Publish co-selling playbook",
        "Document lead-sharing, opportunity registration and joint-selling processes.",
        "todo",
        "inFiveDays",
        ["lead"],
      ),

      defineCompanyTask(
        "partner-office-hours",
        "Schedule partner office hours",
        "Create recurring support sessions for partner questions and demonstrations.",
        "todo",
        "nextWeek",
        [],
      ),
    ],
  },

  {
    projectId: COMPANY_PROJECT_IDS.CRM_DATA_QUALITY,

    tasks: [
      defineCompanyTask(
        "crm-duplicate-accounts",
        "Identify duplicate accounts",
        "Produce a reviewed list of customer and prospect records requiring consolidation.",
        "done",
        "oneWeekAgo",
        ["lead"],
      ),

      defineCompanyTask(
        "crm-required-fields",
        "Define required account fields",
        "Agree on the minimum information required for reliable reporting.",
        "done",
        "yesterday",
        ["representative", "lead"],
      ),

      defineCompanyTask(
        "crm-merge-organizations",
        "Merge duplicate organizations",
        "Consolidate verified duplicate records without losing activity history.",
        "doing",
        "today",
        ["lead"],
      ),

      defineCompanyTask(
        "crm-close-dates",
        "Validate opportunity close dates",
        "Review overdue and unrealistic close dates with opportunity owners.",
        "todo",
        "inTwoDays",
        ["representative"],
      ),

      defineCompanyTask(
        "crm-data-standards",
        "Publish CRM data standards",
        "Document account, contact and opportunity data-entry expectations.",
        "todo",
        "nextWeek",
        ["lead"],
      ),
    ],
  },
  // Customer Success

  {
    projectId: COMPANY_PROJECT_IDS.CLIENT_ONBOARDING,

    tasks: [
      defineCompanyTask(
        "onboarding-map-journey",
        "Map the customer onboarding journey",
        "Document every customer interaction from contract signing to operational handover.",
        "done",
        "twoWeeksAgo",
        ["lead"],
      ),

      defineCompanyTask(
        "onboarding-success-milestones",
        "Agree on success milestones",
        "Define the outcomes customers should achieve during their first 30 days.",
        "done",
        "oneWeekAgo",
        ["representative", "lead"],
      ),

      defineCompanyTask(
        "onboarding-kickoff-template",
        "Create kickoff meeting template",
        "Standardize the agenda, preparation and follow-up for customer kickoff meetings.",
        "doing",
        "today",
        ["lead"],
      ),

      defineCompanyTask(
        "onboarding-welcome-emails",
        "Automate welcome emails",
        "Configure customer welcome messages and role-specific onboarding resources.",
        "doing",
        "inThreeDays",
        ["lead"],
      ),

      defineCompanyTask(
        "onboarding-checklist-pilot",
        "Pilot the onboarding checklist",
        "Test the revised checklist with the next eligible customer account.",
        "todo",
        "nextWeek",
        ["representative"],
      ),
    ],
  },

  {
    projectId: COMPANY_PROJECT_IDS.HELP_CENTRE,

    tasks: [
      defineCompanyTask(
        "help-audit-articles",
        "Audit existing support articles",
        "Identify outdated, duplicated and frequently unsuccessful help-centre content.",
        "done",
        "tenDaysAgo",
        ["lead"],
      ),

      defineCompanyTask(
        "help-content-taxonomy",
        "Define content taxonomy",
        "Organize guidance by product area, user objective and troubleshooting topic.",
        "done",
        "yesterday",
        ["representative", "lead"],
      ),

      defineCompanyTask(
        "help-billing-articles",
        "Rewrite billing articles",
        "Improve the guidance for invoices, payment methods and subscription changes.",
        "doing",
        "tomorrow",
        ["lead"],
      ),

      defineCompanyTask(
        "help-video-tutorials",
        "Record video tutorials",
        "Create short tutorials for the most common customer setup activities.",
        "todo",
        "inFourDays",
        ["representative"],
      ),

      defineCompanyTask(
        "help-search-improvements",
        "Publish search improvements",
        "Add keywords and redirects for common unsuccessful customer searches.",
        "todo",
        "nextWeek",
        ["lead"],
      ),
    ],
  },

  {
    projectId: COMPANY_PROJECT_IDS.RENEWAL_HEALTH,

    tasks: [
      defineCompanyTask(
        "renewal-health-score",
        "Define customer health score",
        "Agree on product usage, support and relationship indicators for renewal health.",
        "done",
        "oneWeekAgo",
        ["representative", "lead"],
      ),

      defineCompanyTask(
        "renewal-date-validation",
        "Validate renewal dates",
        "Confirm contract renewal dates and notice periods for managed customer accounts.",
        "done",
        "yesterday",
        ["lead"],
      ),

      defineCompanyTask(
        "renewal-risk-review",
        "Review at-risk accounts",
        "Assess customers with declining usage, open escalations or weak engagement.",
        "doing",
        "today",
        ["lead"],
      ),

      defineCompanyTask(
        "renewal-action-plans",
        "Prepare executive action plans",
        "Document ownership and recovery actions for high-value renewal risks.",
        "todo",
        "overdue",
        ["representative"],
      ),

      defineCompanyTask(
        "renewal-customer-checkins",
        "Schedule customer check-ins",
        "Arrange proactive conversations with customers approaching renewal.",
        "todo",
        null,
        [],
      ),
    ],
  },
  {
    projectId: COMPANY_PROJECT_IDS.GRADUATE_RECRUITMENT,

    tasks: [
      defineCompanyTask(
        "graduate-hiring-targets",
        "Confirm graduate hiring targets",
        "Agree on the number of graduate positions required by each department.",
        "done",
        "twoWeeksAgo",
        ["representative", "lead"],
      ),

      defineCompanyTask(
        "graduate-university-selection",
        "Select partner universities",
        "Prioritize universities and academic programmes for graduate outreach.",
        "done",
        "oneWeekAgo",
        ["lead"],
      ),

      defineCompanyTask(
        "graduate-assessment-rubric",
        "Prepare assessment rubric",
        "Define consistent scoring criteria for technical and behavioural assessment.",
        "doing",
        "inTwoDays",
        ["lead"],
      ),

      defineCompanyTask(
        "graduate-campus-events",
        "Schedule campus events",
        "Coordinate career fairs, presentations and student networking sessions.",
        "todo",
        "inFiveDays",
        ["lead"],
      ),

      defineCompanyTask(
        "graduate-candidate-messages",
        "Configure candidate communications",
        "Prepare acknowledgement, interview and outcome messages for applicants.",
        "todo",
        "nextWeek",
        ["representative"],
      ),
    ],
  },

  {
    projectId: COMPANY_PROJECT_IDS.MANAGER_DEVELOPMENT,

    tasks: [
      defineCompanyTask(
        "manager-learning-needs",
        "Gather manager learning needs",
        "Collect feedback about the most important challenges faced by current managers.",
        "done",
        "tenDaysAgo",
        ["lead"],
      ),

      defineCompanyTask(
        "manager-competencies",
        "Approve manager competencies",
        "Confirm the leadership behaviours expected from Aurora managers.",
        "done",
        "yesterday",
        ["representative", "lead"],
      ),

      defineCompanyTask(
        "manager-workshop-modules",
        "Design workshop modules",
        "Create practical modules covering feedback, delegation and team performance.",
        "doing",
        "tomorrow",
        ["lead"],
      ),

      defineCompanyTask(
        "manager-internal-mentors",
        "Identify internal mentors",
        "Select experienced leaders who can support programme participants.",
        "todo",
        "inFourDays",
        ["representative"],
      ),

      defineCompanyTask(
        "manager-pilot-cohort",
        "Schedule pilot cohort",
        "Select the initial group and arrange the programme launch session.",
        "todo",
        null,
        [],
      ),
    ],
  },

  {
    projectId: COMPANY_PROJECT_IDS.HYBRID_WORK,

    tasks: [
      defineCompanyTask(
        "hybrid-employee-survey",
        "Analyse employee survey",
        "Review employee feedback about collaboration, focus time and office attendance.",
        "done",
        "oneWeekAgo",
        ["lead"],
      ),

      defineCompanyTask(
        "hybrid-working-principles",
        "Draft hybrid-working principles",
        "Define clear principles balancing team coordination and employee flexibility.",
        "done",
        "yesterday",
        ["representative", "lead"],
      ),

      defineCompanyTask(
        "hybrid-meeting-standards",
        "Document meeting standards",
        "Create inclusive standards for meetings with remote and office participants.",
        "doing",
        "today",
        ["lead"],
      ),

      defineCompanyTask(
        "hybrid-security-guidance",
        "Review remote-work security guidance",
        "Confirm secure access and confidential-information practices for remote work.",
        "todo",
        "inThreeDays",
        ["representative"],
      ),

      defineCompanyTask(
        "hybrid-publish-handbook",
        "Publish employee handbook",
        "Release the approved guidance and communicate it across the company.",
        "todo",
        "nextWeek",
        ["lead"],
      ),
    ],
  },
  {
    projectId: COMPANY_PROJECT_IDS.BUDGET_PLANNING,

    tasks: [
      defineCompanyTask(
        "budget-forecast-templates",
        "Issue forecast templates",
        "Provide department leads with standardized operating-budget templates.",
        "done",
        "twoWeeksAgo",
        ["lead"],
      ),

      defineCompanyTask(
        "budget-department-forecasts",
        "Collect department forecasts",
        "Review submitted revenue, staffing and operating-cost assumptions.",
        "done",
        "oneWeekAgo",
        ["lead"],
      ),

      defineCompanyTask(
        "budget-consolidate-costs",
        "Consolidate operating costs",
        "Combine departmental forecasts into the draft company operating plan.",
        "doing",
        "today",
        ["representative", "lead"],
      ),

      defineCompanyTask(
        "budget-growth-assumptions",
        "Challenge high-growth assumptions",
        "Review unusually large increases and document supporting business cases.",
        "todo",
        "overdue",
        ["representative"],
      ),

      defineCompanyTask(
        "budget-board-summary",
        "Prepare board summary",
        "Summarize the proposed budget, major investments and financial risks.",
        "todo",
        "nextWeek",
        ["lead"],
      ),
    ],
  },

  {
    projectId: COMPANY_PROJECT_IDS.PROCUREMENT_REVIEW,

    tasks: [
      defineCompanyTask(
        "procurement-contract-inventory",
        "Inventory supplier contracts",
        "Create a consolidated register of active suppliers, contracts and owners.",
        "done",
        "tenDaysAgo",
        ["lead"],
      ),

      defineCompanyTask(
        "procurement-upcoming-renewals",
        "Identify upcoming renewals",
        "Flag material supplier agreements approaching renewal or termination dates.",
        "done",
        "yesterday",
        ["representative", "lead"],
      ),

      defineCompanyTask(
        "procurement-supplier-evaluation",
        "Evaluate strategic suppliers",
        "Review performance, service quality and commercial value of major suppliers.",
        "doing",
        "tomorrow",
        ["lead"],
      ),

      defineCompanyTask(
        "procurement-cloud-agreement",
        "Negotiate cloud-services agreement",
        "Prepare usage forecasts and commercial requirements for the renewal discussion.",
        "todo",
        "inFiveDays",
        ["representative", "lead"],
      ),

      defineCompanyTask(
        "procurement-renewal-calendar",
        "Publish procurement calendar",
        "Create a shared schedule of supplier reviews and renewal decisions.",
        "todo",
        null,
        [],
      ),
    ],
  },

  {
    projectId: COMPANY_PROJECT_IDS.OFFICE_EXPANSION,

    tasks: [
      defineCompanyTask(
        "office-capacity-requirements",
        "Confirm capacity requirements",
        "Estimate workspace, meeting-room and collaboration-area requirements.",
        "done",
        "oneWeekAgo",
        ["representative", "lead"],
      ),

      defineCompanyTask(
        "office-site-shortlist",
        "Shortlist potential locations",
        "Compare suitable locations using cost, accessibility and capacity criteria.",
        "done",
        "yesterday",
        ["lead"],
      ),

      defineCompanyTask(
        "office-fitout-estimates",
        "Review fit-out estimates",
        "Compare initial construction, furniture and facilities cost estimates.",
        "doing",
        "inTwoDays",
        ["lead"],
      ),

      defineCompanyTask(
        "office-network-requirements",
        "Assess network requirements",
        "Define connectivity, equipment and security requirements for the new space.",
        "todo",
        "inFourDays",
        ["representative"],
      ),

      defineCompanyTask(
        "office-move-timeline",
        "Prepare relocation timeline",
        "Coordinate approvals, fit-out, equipment installation and team relocation.",
        "todo",
        "nextWeek",
        ["lead"],
      ),
    ],
  },
];

function createCompanyUser(id, name, email, passwordHash, timestamp) {
  return {
    id,
    name,
    email,
    passwordHash,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function createWorkspaceMember(id, workspaceId, userId, role, timestamp) {
  return {
    id,
    workspaceId,
    userId,
    role,
    joinedAt: timestamp,
  };
}

function createProjectMember(id, projectId, userId, role, timestamp) {
  return {
    id,
    projectId,
    userId,
    role,
    joinedAt: timestamp,
  };
}

function resolveCompanyTaskAssignees(assignees, departmentLeadId) {
  const availableAssignees = {
    representative: COMPANY_USER_IDS.REPRESENTATIVE,
    lead: departmentLeadId,
  };

  return assignees.map((assigneeType) => {
    const userId = availableAssignees[assigneeType];

    if (!userId) {
      throw new Error(`Unknown company Task assignee: ` + `${assigneeType}`);
    }

    return userId;
  });
}

function createCompanyTask(
  taskDefinition,
  projectDefinition,
  departmentLeadId,
  dueDates,
  timestamp,
) {
  const { id, title, description, status, dueDateKey, assignees } =
    taskDefinition;

  if (dueDateKey !== null && !Object.hasOwn(dueDates, dueDateKey)) {
    throw new Error(`Unknown company Task Due Date: ` + `${dueDateKey}`);
  }

  return {
    id: `aurora-task-${id}`,
    projectId: projectDefinition.id,
    title,
    description,
    status,
    dueDate: dueDateKey === null ? null : dueDates[dueDateKey],
    assigneeIds: resolveCompanyTaskAssignees(assignees, departmentLeadId),
    createdById: projectDefinition.ownerId,
    reporterId: projectDefinition.ownerId,
    version: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createCompanyDemoSeed({ passwordHash, timestamp, dueDates }) {
  const users = [
    createCompanyUser(
      COMPANY_USER_IDS.REPRESENTATIVE,
      "Nadia Perera",
      "company.rep@aurora.example",
      passwordHash,
      timestamp,
    ),

    createCompanyUser(
      COMPANY_USER_IDS.PRODUCT_LEAD,
      "Ashan Silva",
      "product.lead@aurora.example",
      passwordHash,
      timestamp,
    ),

    createCompanyUser(
      COMPANY_USER_IDS.MARKETING_LEAD,
      "Dinithi Jayasinghe",
      "marketing.lead@aurora.example",
      passwordHash,
      timestamp,
    ),

    createCompanyUser(
      COMPANY_USER_IDS.SALES_LEAD,
      "Kavindu Fernando",
      "sales.lead@aurora.example",
      passwordHash,
      timestamp,
    ),

    createCompanyUser(
      COMPANY_USER_IDS.CUSTOMER_SUCCESS_LEAD,
      "Malsha Wijeratne",
      "success.lead@aurora.example",
      passwordHash,
      timestamp,
    ),

    createCompanyUser(
      COMPANY_USER_IDS.PEOPLE_LEAD,
      "Nethmi Karunaratne",
      "people.lead@aurora.example",
      passwordHash,
      timestamp,
    ),

    createCompanyUser(
      COMPANY_USER_IDS.OPERATIONS_LEAD,
      "Tharindu Senanayake",
      "operations.lead@aurora.example",
      passwordHash,
      timestamp,
    ),
  ];

  const workspaces = COMPANY_WORKSPACE_DEFINITIONS.map(
    (workspaceDefinition) => ({
      id: workspaceDefinition.id,
      name: workspaceDefinition.name,
      slug: workspaceDefinition.slug,
      ownerId: COMPANY_USER_IDS.REPRESENTATIVE,
      createdAt: timestamp,
      updatedAt: timestamp,
    }),
  );

  const workspaceMembers = COMPANY_WORKSPACE_DEFINITIONS.flatMap(
    (workspaceDefinition) => [
      createWorkspaceMember(
        `company-wm-${workspaceDefinition.id}` + "-representative",
        workspaceDefinition.id,
        COMPANY_USER_IDS.REPRESENTATIVE,
        WORKSPACE_ROLES.OWNER,
        timestamp,
      ),

      createWorkspaceMember(
        `company-wm-${workspaceDefinition.id}` + "-lead",
        workspaceDefinition.id,
        workspaceDefinition.leadUserId,
        WORKSPACE_ROLES.ADMIN,
        timestamp,
      ),
    ],
  );

  const workspaceLeadIds = new Map(
    COMPANY_WORKSPACE_DEFINITIONS.map((workspaceDefinition) => [
      workspaceDefinition.id,
      workspaceDefinition.leadUserId,
    ]),
  );

  const projects = COMPANY_PROJECT_DEFINITIONS.map((projectDefinition) => ({
    ...projectDefinition,
    ownerId: COMPANY_USER_IDS.REPRESENTATIVE,
    workflowStatuses: createDefaultWorkflowStatuses(),
    createdAt: timestamp,
    updatedAt: timestamp,
  }));

  const projectMembers = COMPANY_PROJECT_DEFINITIONS.flatMap(
    (projectDefinition) => {
      const departmentLeadId = workspaceLeadIds.get(
        projectDefinition.workspaceId,
      );

      if (!departmentLeadId) {
        throw new Error(
          "Company Project is not connected " + "to a department lead",
        );
      }

      return [
        createProjectMember(
          `company-pm-${projectDefinition.id}` + "-representative",
          projectDefinition.id,
          COMPANY_USER_IDS.REPRESENTATIVE,
          PROJECT_ROLES.OWNER,
          timestamp,
        ),

        createProjectMember(
          `company-pm-${projectDefinition.id}` + "-lead",
          projectDefinition.id,
          departmentLeadId,
          PROJECT_ROLES.CONTRIBUTOR,
          timestamp,
        ),
      ];
    },
  );

  const projectDefinitionsById = new Map(
    projects.map((project) => [project.id, project]),
  );

  const tasks = COMPANY_TASK_GROUPS.flatMap((taskGroup) => {
    const projectDefinition = projectDefinitionsById.get(taskGroup.projectId);

    if (!projectDefinition) {
      throw new Error(
        "Company Task group is not connected " + "to a valid Project",
      );
    }

    const departmentLeadId = workspaceLeadIds.get(
      projectDefinition.workspaceId,
    );

    if (!departmentLeadId) {
      throw new Error(
        "Company Task group is not connected " + "to a department lead",
      );
    }

    return taskGroup.tasks.map((taskDefinition) =>
      createCompanyTask(
        taskDefinition,
        projectDefinition,
        departmentLeadId,
        dueDates,
        timestamp,
      ),
    );
  });

  return {
    users,
    workspaces,
    workspaceMembers,
    projects,
    projectMembers,
    projectInvitations: [],
    tasks,
  };
}
