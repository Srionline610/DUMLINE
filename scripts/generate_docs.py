import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#666666"))
        
        # Header (Pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "DUMLINE — Technical Design Document")
            self.drawRightString(612 - 54, 750, "https://github.com/Srionline610/DUMLINE.git")
            self.setStrokeColor(colors.HexColor("#D8CEBF"))
            self.setLineWidth(0.5)
            self.line(54, 744, 612 - 54, 744)

        # Footer (All pages)
        self.setStrokeColor(colors.HexColor("#D8CEBF"))
        self.setLineWidth(0.5)
        self.line(54, 45, 612 - 54, 45)
        self.drawString(54, 32, "DUMLINE | IsoCode Labs Assessment Submission")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(612 - 54, 32, page_str)
        self.restoreState()

def build_pdf(filename="docs/Technical-Design-Document.pdf"):
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()
    
    # Custom Palette
    c_primary = colors.HexColor("#9E3428")     # Crimson
    c_dark = colors.HexColor("#211C18")        # Charcoal
    c_gold = colors.HexColor("#8C5E1A")        # Deep Saffron
    c_bg = colors.HexColor("#F7F3EA")          # Royal Ivory
    c_line = colors.HexColor("#E5DCCB")

    # Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=c_primary,
        spaceAfter=4
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=c_gold,
        spaceAfter=12
    )
    
    repo_banner_style = ParagraphStyle(
        'RepoBanner',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#1E3A8A")
    )
    
    h1_style = ParagraphStyle(
        'Heading1Custom',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=c_primary,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=c_dark,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12.5,
        textColor=c_dark,
        spaceAfter=5
    )

    bullet_style = ParagraphStyle(
        'BulletCustom',
        parent=body_style,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=3
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10.5,
        textColor=c_dark
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10.5,
        textColor=c_dark
    )

    story = []

    # Title & Repository Header
    story.append(Paragraph("DUMLINE — Technical Design Document", title_style))
    story.append(Paragraph("The Modern Royal Kitchen — Direct Ordering & Kitchen Operations Platform", subtitle_style))
    
    # Prominent GitHub Repo Banner
    repo_table = Table(
        [[Paragraph("<b>GitHub Project Repository:</b> https://github.com/Srionline610/DUMLINE.git", repo_banner_style),
          Paragraph("<b>Assessment:</b> IsoCode Labs Intern", table_cell_bold)]],
        colWidths=[360, 144]
    )
    repo_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#EBF3FC")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#93C5FD")),
        ('PADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(repo_table)
    story.append(Spacer(1, 10))

    # Meta Info Table
    meta_data = [
        [Paragraph("<b>Author / Candidate:</b> Senior Full-Stack Engineering Candidate", table_cell_style),
         Paragraph("<b>Local Dev URL:</b> http://localhost:3001 (Web) / :3000 (API)", table_cell_style)],
        [Paragraph("<b>Status:</b> Assessment Complete & Verified", table_cell_style),
         Paragraph("<b>Architecture:</b> Next.js 16 + Express 5 + Prisma 7 + MySQL", table_cell_style)]
    ]
    meta_table = Table(meta_data, colWidths=[250, 254])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_bg),
        ('BOX', (0,0), (-1,-1), 0.5, c_line),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 12))

    # Section 1: Executive Summary & Project Concept
    story.append(Paragraph("1. Executive Summary & Project Identity", h1_style))
    story.append(Paragraph(
        "DUMLINE is a premium, full-stack direct-ordering and kitchen management platform designed for a "
        "high-volume, authentic Hyderabadi biryani restaurant chain. Built for the IsoCode Labs Software "
        "Engineering Intern Assessment, the platform addresses high-volume operational bottlenecks by combining "
        "a customer-facing digital ordering storefront with a real-time Kitchen Display System (KDS), an AI-assisted "
        "order preparation-time estimator with mathematical fallback, and centralized multi-outlet catalog governance.",
        body_style
    ))
    story.append(Paragraph(
        "<b>Core Architectural Directives:</b>", body_style
    ))
    story.append(Paragraph("• <b>Reliability Over Illusion:</b> Real Node.js + Express backend with transactional MySQL persistence and state machine validation. Zero fake buttons or mock timeouts represented as real.", bullet_style))
    story.append(Paragraph("• <b>Single-Outlet Cart Isolation:</b> Cart state is strictly bound to one outlet with defensive modal confirmation upon outlet switching.", bullet_style))
    story.append(Paragraph("• <b>Server-Enforced Financial Integrity:</b> GST calculation is 5% inclusive (calculated via base = price / 1.05); frontend prices are verified on backend prior to payment authorization.", bullet_style))
    story.append(Paragraph("• <b>Two Purpose-Built Design Systems:</b> Editorial royal heritage for customers (WCAG AA compliant) and high-contrast, touch-optimized UI for kitchen operators.", bullet_style))

    # Section 2: Architecture & System Overview
    story.append(Paragraph("2. System Architecture & Monorepo Rationale", h1_style))
    story.append(Paragraph(
        "DUMLINE is organized as a clean TypeScript monorepo with strict package boundaries:",
        body_style
    ))
    
    arch_data = [
        [Paragraph("Package", table_header_style), Paragraph("Technology Stack", table_header_style), Paragraph("Architectural Rationale", table_header_style)],
        [Paragraph("<b>apps/server</b><br/>(Backend API & Engine)", table_cell_bold),
         Paragraph("Express 5, Node.js 22, Socket.IO 4, Prisma 7, MySQL 8, Argon2id, Zod", table_cell_style),
         Paragraph("Dedicated process architecture guarantees persistent WebSocket connections for KDS, background overdue monitoring loops, and resilient state machine transactions impossible on serverless runtimes.", table_cell_style)],
        [Paragraph("<b>apps/web</b><br/>(Frontend Application)", table_cell_bold),
         Paragraph("Next.js 16.4.5 (App Router), React 19, Tailwind CSS, Motion (framer-motion), Zustand", table_cell_style),
         Paragraph("Server-Side Rendering (SSR) for blazing initial loads, coupled with client-side Zustand stores for instant cart manipulation and high-fidelity micro-interactions.", table_cell_style)],
        [Paragraph("<b>packages/shared</b><br/>(Core Contracts)", table_cell_bold),
         Paragraph("TypeScript 5.8, Zod 3.24", table_cell_style),
         Paragraph("Single source of truth for request/response schemas, DTOs, business constants, and error codes shared across client and server.", table_cell_style)]
    ]
    t_arch = Table(arch_data, colWidths=[110, 150, 244])
    t_arch.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_primary),
        ('GRID', (0,0), (-1,-1), 0.5, c_line),
        ('PADDING', (0,0), (-1,-1), 4),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t_arch)
    story.append(Spacer(1, 8))

    # Section 3: Data Model & Persistence
    story.append(Paragraph("3. Relational Data Model & Integrity", h1_style))
    story.append(Paragraph(
        "The relational schema is managed by Prisma ORM 7 against MySQL 8.0, enforcing strict foreign key constraints, "
        "cascading relationships, and indexing across high-traffic query patterns:",
        body_style
    ))

    schema_data = [
        [Paragraph("Model", table_header_style), Paragraph("Key Attributes", table_header_style), Paragraph("Business & Referential Rules", table_header_style)],
        [Paragraph("<b>User</b>", table_cell_bold),
         Paragraph("id, email, passwordHash, role, assignedOutletId", table_cell_style),
         Paragraph("RBAC roles: CUSTOMER, KITCHEN_STAFF, OUTLET_MANAGER, ADMIN. Argon2id hashed credentials. Staff/managers bound to specific outlet.", table_cell_style)],
        [Paragraph("<b>Outlet</b>", table_cell_bold),
         Paragraph("id, name, slug, address, serviceRadiusKm, minPrepMinutes, isActive", table_cell_style),
         Paragraph("Defines geographic fulfillment bounds, operational minimum preparation floor (T_min), and delivery radius limits.", table_cell_style)],
        [Paragraph("<b>MenuItem</b>", table_cell_bold),
         Paragraph("id, name, slug, category, basePrice, gstRate, stationCategory, prepComplexityTags", table_cell_style),
         Paragraph("Global master catalog. Station tags (BIRYANI, TANDOOR, CURRY, DESSERT) and complexity tags enable intelligent parallel preparation scheduling.", table_cell_style)],
        [Paragraph("<b>OutletMenuItem</b>", table_cell_bold),
         Paragraph("outletId, menuItemId, priceOverride, isAvailable", table_cell_style),
         Paragraph("Composite primary key (outletId, menuItemId). Supports localized price adjustments and immediate item 86ing (stock depletion).", table_cell_style)],
        [Paragraph("<b>Order</b>", table_cell_bold),
         Paragraph("id, orderNumber, customerId, outletId, status, fulfillmentType, subtotal, taxAmount, totalAmount, promisedMinutes, promisedAt", table_cell_style),
         Paragraph("Enforces OrderStatus state machine. Stores binding promised preparation time and audit timestamps.", table_cell_style)],
        [Paragraph("<b>OrderItem</b>", table_cell_bold),
         Paragraph("id, orderId, menuItemId, name, unitPrice, quantity, spiceLevel, portionSize, totalPrice", table_cell_style),
         Paragraph("Snapshots item name and pricing at time of purchase. Immutable historical record.", table_cell_style)],
        [Paragraph("<b>Payment</b>", table_cell_bold),
         Paragraph("id, orderId, method, status, amount, transactionRef, idempotencyKey", table_cell_style),
         Paragraph("Simulates UPI/Card settlement. Idempotency key uniqueness prevents duplicate charges and race conditions.", table_cell_style)],
        [Paragraph("<b>AuditLog</b>", table_cell_bold),
         Paragraph("id, orderId, action, previousStatus, newStatus, actorId, reason, createdAt", table_cell_style),
         Paragraph("Immutable journal of all state transitions, prep-time overrides, cancellations, and overdue escalations.", table_cell_style)]
    ]
    t_schema = Table(schema_data, colWidths=[90, 160, 254])
    t_schema.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_dark),
        ('GRID', (0,0), (-1,-1), 0.5, c_line),
        ('PADDING', (0,0), (-1,-1), 3.5),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t_schema)
    story.append(Spacer(1, 8))

    # Section 4: Main User Flows & Core Business Logic
    story.append(Paragraph("4. Core User Flows & State Orchestration", h1_style))
    story.append(Paragraph(
        "<b>A. Customer Ordering & Checkout Lifecycle:</b>", h2_style
    ))
    story.append(Paragraph("1. <i>Guest Browsing & Outlet Selection:</i> Customers freely browse the menu and switch outlets. Outlet selection sets operational context.", bullet_style))
    story.append(Paragraph("2. <i>Single-Outlet Cart Isolation:</i> Adding an item locks the cart to that outlet. Switching outlets presents a confirmation modal warning that existing cart contents will be cleared.", bullet_style))
    story.append(Paragraph("3. <i>Mandatory Authentication Gate:</i> Checkout enforces authentication. Guests can register or log in with session tokens persisted via secure HTTP authorization headers.", bullet_style))
    story.append(Paragraph("4. <i>Inclusive GST Calculation:</i> Displayed prices are 5% GST-inclusive. Checkout breakdown: Base Price = Total / 1.05; GST Amount = Total - Base Price. Zero surprise checkout markups.", bullet_style))
    story.append(Paragraph("5. <i>Mock Payment Contract & Idempotency:</i> Test triggers: UPI `success@upi` or Card `4242` yield immediate approval; `fail@upi` or `0002` simulate banking failures. Requests require a client-generated UUID idempotency key preventing duplicate orders.", bullet_style))
    
    story.append(Paragraph(
        "<b>B. Strict Order State Machine:</b>", h2_style
    ))
    story.append(Paragraph(
        "All state transitions are committed to MySQL prior to emitting Socket.IO broadcast events. Valid transitions: "
        "<b>PLACED → ACCEPTED → PREPARING → READY → COMPLETED</b>. Cancellations are restricted to PLACED or ACCEPTED; "
        "cancellations during PREPARING require Outlet Manager authorization.",
        body_style
    ))

    # Section 5: AI Preparation-Time Estimator & Deterministic Fallback
    story.append(Paragraph("5. AI Prep Estimator & Overdue Alerting System", h1_style))
    story.append(Paragraph(
        "To balance intelligent scheduling with operational resilience, DUMLINE implements a four-tier preparation formula:",
        body_style
    ))
    story.append(Paragraph("1. <b>AI Estimate (E_AI):</b> Powered by Google Gemini 1.5 Flash via official SDK. Uses structured schema prompts detailing item categories, complexity tags (e.g., `DUM_COOKING`, `TANDOOR`, `READY_TO_SERVE`), active kitchen queue depth, and peak-hour multipliers.", bullet_style))
    story.append(Paragraph("2. <b>Parallel Kitchen Station Safeguard:</b> The model is instructed to schedule independent stations (Biryani, Tandoor, Salan/Dessert) concurrently rather than additively summing preparation times.", bullet_style))
    story.append(Paragraph("3. <b>Deterministic Fallback (E_Fallback):</b> If Gemini API is unreachable, times out (>3000ms), or returns schema violations, the system instantly evaluates:<br/>"
                           "&nbsp;&nbsp;&nbsp;&nbsp;<b>E_Fallback = BasePrep (10m) + max(StationPrep) + (ActiveOrders × 2m) + (AdditionalPortions × 1.5m)</b>", bullet_style))
    story.append(Paragraph("4. <b>Final Promised Preparation Time (T_Promised):</b> Binding threshold presented to customer and KDS:<br/>"
                           "&nbsp;&nbsp;&nbsp;&nbsp;<b>T_Promised = max(E_Active, T_min)</b>, clamped strictly within [5, 120] minutes.", bullet_style))
    story.append(Paragraph("5. <b>Automated Overdue Alerting:</b> When Elapsed Time >= T_Promised + 10 minutes and order is not READY/COMPLETED, the server broadcasts `order:overdue-alert` to KDS and customer screen, accompanied by an urgent audio chime and visual pulse.", bullet_style))

    # Section 6: User Interface & Design Decisions
    story.append(Paragraph("6. Visual Design Systems & Accessibility Guardrails", h1_style))
    story.append(Paragraph(
        "DUMLINE features two tailored design systems optimized for their operational contexts:",
        body_style
    ))
    
    ui_data = [
        [Paragraph("Design Dimension", table_header_style), Paragraph("Customer Storefront System", table_header_style), Paragraph("Kitchen Display System (KDS)", table_header_style)],
        [Paragraph("<b>Atmosphere</b>", table_cell_bold),
         Paragraph("Royal Hyderabadi culinary heritage, editorial layout, subtle warm animations.", table_cell_style),
         Paragraph("Industrial, glare-resistant dark canvas (`#1E1915`) designed for high-stress commercial kitchens.", table_cell_style)],
        [Paragraph("<b>Typography</b>", table_cell_bold),
         Paragraph("Cormorant Garamond (Royal Display), Manrope (Clean UI Body).", table_cell_style),
         Paragraph("High-contrast Manrope with bold numeric counters readable from 3–5 feet away.", table_cell_style)],
        [Paragraph("<b>Color Palette</b>", table_cell_bold),
         Paragraph("Royal Ivory (`#F7F3EA`), Charcoal Umber (`#211C18`), Biryani Crimson (`#9E3428`), Antique Saffron (`#C18A3B`).", table_cell_style),
         Paragraph("Dark slate canvas with high-visibility semantic status badges (Green=New, Amber=Cooking, Red=Overdue).", table_cell_style)],
        [Paragraph("<b>Accessibility & WCAG</b>", table_cell_bold),
         Paragraph("WCAG 2.2 AA compliant. Antique Saffron text on ivory is strictly prohibited (contrast ~2.8:1); darkened Deep Saffron (`#8C5E1A`) used for text to guarantee >=4.5:1 ratio.", table_cell_style),
         Paragraph("Touch targets >= 48x48px for greasy tablet interactions; full `prefers-reduced-motion` compliance.", table_cell_style)]
    ]
    t_ui = Table(ui_data, colWidths=[100, 202, 202])
    t_ui.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_gold),
        ('GRID', (0,0), (-1,-1), 0.5, c_line),
        ('PADDING', (0,0), (-1,-1), 4),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t_ui)
    story.append(Spacer(1, 8))

    # Section 7: Mandatory Assessment Seed Fixtures
    story.append(Paragraph("7. Mandatory Assessment Seed Fixtures", h1_style))
    story.append(Paragraph(
        "As mandated by the IsoCode Labs assessment brief, the database seed registers three immutable reference orders:",
        body_style
    ))
    
    fix_data = [
        [Paragraph("Order ID", table_header_style), Paragraph("Outlet Name", table_header_style), Paragraph("Status", table_header_style), Paragraph("Payment", table_header_style), Paragraph("Amount", table_header_style), Paragraph("Promised Time", table_header_style)],
        [Paragraph("<b>WEB-778120</b>", table_cell_bold), Paragraph("Jubilee Hills", table_cell_style), Paragraph("<font color='#D97706'>PREPARING</font>", table_cell_bold), Paragraph("UPI (success@upi)", table_cell_style), Paragraph("₹1,290.00", table_cell_style), Paragraph("2026-11-05 13:30:00", table_cell_style)],
        [Paragraph("<b>WEB-778131</b>", table_cell_bold), Paragraph("Banjara Hills", table_cell_style), Paragraph("<font color='#16A34A'>READY</font>", table_cell_bold), Paragraph("Card (ending 4242)", table_cell_style), Paragraph("₹2,450.00", table_cell_style), Paragraph("2026-11-05 13:45:00", table_cell_style)],
        [Paragraph("<b>WEB-778146</b>", table_cell_bold), Paragraph("Gachibowli", table_cell_style), Paragraph("<font color='#4B5563'>COMPLETED</font>", table_cell_bold), Paragraph("UPI (success@upi)", table_cell_style), Paragraph("₹890.00", table_cell_style), Paragraph("2026-11-05 13:15:00", table_cell_style)]
    ]
    t_fix = Table(fix_data, colWidths=[90, 85, 75, 95, 65, 94])
    t_fix.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_dark),
        ('GRID', (0,0), (-1,-1), 0.5, c_line),
        ('PADDING', (0,0), (-1,-1), 4),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t_fix)
    story.append(Spacer(1, 8))

    # Section 8: Scope Boundaries & Explicit Exclusions
    story.append(Paragraph("8. Scope Boundaries & Intentional Exclusions", h1_style))
    story.append(Paragraph(
        "To maintain architectural rigor and deliver a zero-defect core product within assessment constraints, "
        "the following external integrations are intentionally simulated or excluded:",
        body_style
    ))
    story.append(Paragraph("• <b>Simulated Direct Delivery:</b> Addresses are validated against outlet delivery radius without third-party geocoding API keys. Fulfillment progresses to dispatch and handoff without external rider GPS tracking.", bullet_style))
    story.append(Paragraph("• <b>Mock Payment Processing:</b> Server-side payment contract supports realistic UPI VPA and Card validation without exposing sensitive financial keys.", bullet_style))
    story.append(Paragraph("• <b>No Real Hardware POS Printers:</b> Kitchen orders are dispatched via real-time WebSocket KDS rather than physical ESC/POS thermal printers.", bullet_style))

    # Section 9: Future Roadmap & Improvements
    story.append(Paragraph("9. Future Extensibility & Architectural Roadmap", h1_style))
    story.append(Paragraph("• <b>Royal Loyalty Program:</b> Post-MVP loyalty ledger awarding 'Nawab Points' based on spend tiers.", bullet_style))
    story.append(Paragraph("• <b>Multi-Cluster Scaling:</b> Redis adapter for Socket.IO horizontal scaling across multiple Node.js container instances.", bullet_style))
    story.append(Paragraph("• <b>Live Geocoding & Logistics:</b> Integration with Mapbox and third-party delivery dispatch APIs (Dunzo/Shadowfax).", bullet_style))

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Generated PDF successfully at {filename}")

def build_docx(filename="docs/Technical-Design-Document.docx"):
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    doc = docx.Document()

    # Set Margins
    for s in doc.sections:
        s.top_margin = Inches(0.75)
        s.bottom_margin = Inches(0.75)
        s.left_margin = Inches(0.75)
        s.right_margin = Inches(0.75)

    # Document Title
    p_title = doc.add_paragraph()
    r_title = p_title.add_run("DUMLINE — Technical Design Document")
    r_title.bold = True
    r_title.font.size = Pt(22)
    r_title.font.color.rgb = RGBColor(158, 52, 40) # Crimson

    p_sub = doc.add_paragraph()
    r_sub = p_sub.add_run("The Modern Royal Kitchen — Direct Ordering & Kitchen Operations Platform")
    r_sub.font.size = Pt(12)
    r_sub.bold = True
    r_sub.font.color.rgb = RGBColor(140, 94, 26) # Saffron

    # Repo Banner
    p_repo = doc.add_paragraph()
    p_repo.paragraph_format.space_before = Pt(6)
    p_repo.paragraph_format.space_after = Pt(12)
    r_rep = p_repo.add_run("GitHub Project Repository: https://github.com/Srionline610/DUMLINE.git\n")
    r_rep.bold = True
    r_rep.font.color.rgb = RGBColor(30, 58, 138)
    r_rep2 = p_repo.add_run("Assessment: IsoCode Labs Software Engineering Intern Assessment\nLocal Development URL: http://localhost:3001 (Web) | http://localhost:3000 (API)")
    r_rep2.font.size = Pt(9.5)

    # Section 1
    doc.add_heading("1. Executive Summary & Project Concept", level=1)
    doc.add_paragraph(
        "DUMLINE is a premium, full-stack direct-ordering and kitchen management platform designed for a "
        "high-volume, authentic Hyderabadi biryani restaurant chain. Built for the IsoCode Labs Software "
        "Engineering Intern Assessment, the platform addresses high-volume operational bottlenecks by combining "
        "a customer-facing digital ordering storefront with a real-time Kitchen Display System (KDS), an AI-assisted "
        "order preparation-time estimator with mathematical fallback, and centralized multi-outlet catalog governance."
    )

    # Section 2
    doc.add_heading("2. System Architecture & Monorepo Rationale", level=1)
    doc.add_paragraph(
        "DUMLINE is organized as a clean TypeScript monorepo with three core workspaces:\n"
        "• apps/server: Dedicated Express 5 and Socket.IO 4 server with Prisma 7 ORM connecting to MySQL 8.0.\n"
        "• apps/web: Next.js 16.4.5 App Router with React 19, Tailwind CSS, Motion, and Zustand client state.\n"
        "• packages/shared: Shared Zod validation schemas, business constants, and TypeScript interfaces."
    )

    # Section 3
    doc.add_heading("3. Relational Data Model & Integrity", level=1)
    doc.add_paragraph(
        "Managed via Prisma ORM 7 against MySQL 8.0, the schema enforces relational integrity across eight core entities:\n"
        "• User: RBAC (CUSTOMER, KITCHEN_STAFF, OUTLET_MANAGER, ADMIN) with Argon2id password hashing.\n"
        "• Outlet: Geographic coordinates, service radius, and minimum prep floor (T_min).\n"
        "• MenuItem: Master catalog dishes tagged with kitchen stations and cooking complexity flags.\n"
        "• OutletMenuItem: Per-outlet pricing overrides and immediate 86ing availability.\n"
        "• Order: Validated OrderStatus state machine transitions and promised delivery times.\n"
        "• OrderItem: Immutable item snapshots capturing unit prices, custom spice levels, and notes.\n"
        "• Payment: UPI/Card transaction records with client-generated idempotency keys.\n"
        "• AuditLog: Comprehensive audit trail tracking state transitions, manager overrides, and overdue alerts."
    )

    # Section 4
    doc.add_heading("4. Main User Flows & Business Logic", level=1)
    doc.add_paragraph(
        "• Single-Outlet Cart Isolation: Carts are bound to one outlet; switching outlets requires user confirmation.\n"
        "• Mandatory Authentication: Customers must log in or register before checking out.\n"
        "• Inclusive GST Calculation: 5% restaurant GST is built into retail prices (Base = Price / 1.05).\n"
        "• Mock Payment Contract: Deterministic test triggers (UPI success@upi or Card 4242 succeed; fail@upi or 0002 fail).\n"
        "• Strict State Machine: PLACED -> ACCEPTED -> PREPARING -> READY -> COMPLETED. Cancellations require manager authorization once in PREPARING."
    )

    # Section 5
    doc.add_heading("5. AI Preparation-Time Estimator & Deterministic Fallback", level=1)
    doc.add_paragraph(
        "• AI Estimate (E_AI): Google Gemini 1.5 Flash structured prompt factoring in complexity tags and station load.\n"
        "• Parallel Station Model: Concurrently prepares Biryani and Tandoor/Dessert stations to prevent additive over-estimation.\n"
        "• Deterministic Fallback Formula: BasePrep (10m) + max(StationPrep) + (ActiveOrders × 2m) + (Portions × 1.5m).\n"
        "• Promised Preparation Time: T_Promised = max(E_Active, T_min), clamped between 5 and 120 minutes.\n"
        "• Overdue Order Alerting: Orders >= 10 minutes overdue trigger real-time audio/visual alerts on KDS and customer screens."
    )

    # Section 6
    doc.add_heading("6. Visual Design Systems & Accessibility Guardrails", level=1)
    doc.add_paragraph(
        "• Customer Experience: Royal Ivory (#F7F3EA), Charcoal Umber (#211C18), Biryani Crimson (#9E3428), Cormorant Garamond typography.\n"
        "• WCAG 2.2 AA Contrast Compliance: Antique Saffron is restricted to borders/icons; Deep Saffron (#8C5E1A) ensures >=4.5:1 text contrast.\n"
        "• KDS Operational Canvas: Glare-resistant dark canvas (#1E1915), 3–5 foot legibility, and minimum 48x48px touch targets."
    )

    # Section 7
    doc.add_heading("7. Mandatory Assessment Seed Fixtures", level=1)
    doc.add_paragraph(
        "The database seed idempotently preserves all three mandatory IsoCode Labs assessment fixtures:\n"
        "• WEB-778120: Jubilee Hills | PREPARING | UPI Paid | ₹1,290.00 | Promised: 2026-11-05 13:30:00\n"
        "• WEB-778131: Banjara Hills | READY | Card Paid | ₹2,450.00 | Promised: 2026-11-05 13:45:00\n"
        "• WEB-778146: Gachibowli | COMPLETED | UPI Paid | ₹890.00 | Promised: 2026-11-05 13:15:00"
    )

    # Section 8
    doc.add_heading("8. Scope Boundaries & Out of Scope", level=1)
    doc.add_paragraph(
        "• Simulated Delivery: Validates delivery radius without third-party geocoding API keys or live rider GPS.\n"
        "• Simulated Payment: Realistic UPI and Card simulation without production payment gateway credentials.\n"
        "• Excluded: Physical POS hardware thermal printers, dining floor-plan reservations."
    )

    doc.save(filename)
    print(f"Generated DOCX successfully at {filename}")

if __name__ == "__main__":
    build_pdf("docs/Technical-Design-Document.pdf")
    build_docx("docs/Technical-Design-Document.docx")

