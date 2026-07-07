from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.productivity import EmailLog


async def send_templated_email(
    db: AsyncSession,
    user_id: int | None,
    recipient_email: str,
    template_type: str,
    context: dict,
) -> dict:
    """
    Simulates sending an email by logging it to the email_logs table
    with rich HTML template compilation.
    """
    # 1. Resolve templates subject and layout
    subject = "InterviewX AI Update"
    html_content = ""

    if template_type == "welcome":
        subject = "Welcome to InterviewX AI! 🚀"
        name = context.get("full_name", "Prep Star")
        html_content = f"""
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #6d28d9;">Hi {name}, welcome to InterviewX AI!</h2>
            <p>We are thrilled to help you master your technical and communication interview preparation.</p>
            <p>Here is what you can do next:</p>
            <ul>
                <li>Upload and analyze your Resume using our ATS Scoring parser.</li>
                <li>Conduct real-time Voice-based Mock Interviews.</li>
                <li>Solve interactive coding challenges (Python, JS, Java, and C++).</li>
            </ul>
            <p>Best regards,<br>The InterviewX Team</p>
        </div>
        """

    elif template_type == "verification":
        subject = "Verify your email address - InterviewX AI"
        code = context.get("code", "000000")
        html_content = f"""
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #6d28d9;">Verify Your Account</h2>
            <p>Please use the following verification code to activate your InterviewX account:</p>
            <div style="font-size: 24px; font-weight: bold; background-color: #f3f4f6; padding: 12px; border-radius: 8px; text-align: center; margin: 20px 0; color: #4f46e5; letter-spacing: 4px;">
                {code}
            </div>
            <p>If you did not request this, you can safely ignore this email.</p>
        </div>
        """

    elif template_type == "reset":
        subject = "Password Reset Request - InterviewX AI"
        link = context.get("link", "http://localhost:3000/reset-password")
        html_content = f"""
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #6d28d9;">Reset Your Password</h2>
            <p>We received a request to reset your password. Click the button below to configure a new password:</p>
            <div style="text-align: center; margin: 25px 0;">
                <a href="{link}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
            </div>
            <p>This recovery link will expire shortly.</p>
        </div>
        """

    elif template_type == "invitation":
        subject = "Interview Invitation - InterviewX AI"
        company = context.get("company_name", "SaaSify Inc.")
        role = context.get("job_role", "Software Engineer")
        link = context.get("link", "http://localhost:3000/interview")
        html_content = f"""
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #6d28d9;">You've Been Invited to Interview!</h2>
            <p><strong>{company}</strong> has invited you to complete a structured mock assessment for the <strong>{role}</strong> position.</p>
            <p>Click the button below to open your workspace and begin the evaluation setup:</p>
            <div style="text-align: center; margin: 25px 0;">
                <a href="{link}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Start Assessment</a>
            </div>
            <p>Good luck!</p>
        </div>
        """

    elif template_type == "reminder":
        subject = "Interview Reminder - InterviewX AI"
        title = context.get("title", "Mock Interview")
        time_str = context.get("time_str", "soon")
        html_content = f"""
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #4f46e5;">Prep reminder: "{title}"</h2>
            <p>This is a quick notification that you have an interview scheduled for:</p>
            <p style="font-size: 16px; font-weight: bold; color: #1f2937;">{time_str}</p>
            <p>Make sure your microphone, camera, and coding workspace are properly configured beforehand.</p>
        </div>
        """

    elif template_type == "weekly_progress":
        subject = "Your Weekly Prep Progress Newsletter"
        interviews = context.get("interviews_completed", 0)
        coding = context.get("coding_solved", 0)
        avg = context.get("avg_score", 0.0)
        html_content = f"""
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #6d28d9;">Your Weekly Progress Summary 📈</h2>
            <p>Here is how you performed this week on InterviewX AI:</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <tr style="border-bottom: 1px solid #f3f4f6;">
                    <td style="padding: 10px 0; color: #4b5563;">Mock Interviews Conducted:</td>
                    <td style="padding: 10px 0; font-weight: bold; text-align: right;">{interviews}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f3f4f6;">
                    <td style="padding: 10px 0; color: #4b5563;">Coding Submissions Solved:</td>
                    <td style="padding: 10px 0; font-weight: bold; text-align: right;">{coding}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; color: #4b5563;">Average Evaluation Score:</td>
                    <td style="padding: 10px 0; font-weight: bold; text-align: right; color: #10b981;">{avg}/10</td>
                </tr>
            </table>
            <p style="margin-top: 20px;">Keep pushing! Consistency is the key to passing your next engineering panel.</p>
        </div>
        """

    elif template_type == "monthly_progress":
        subject = "Monthly Preparation Performance Report 🏆"
        month = context.get("month", "This Month")
        index = context.get("index_score", 85)
        html_content = f"""
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #6d28d9;">{month} Prep Growth Chart</h2>
            <p>Congratulations on completing another month of interview prep. Here is your evaluation rating index:</p>
            <div style="margin: 20px 0; background-color: #e0e7ff; border-radius: 12px; padding: 20px; text-align: center;">
                <p style="font-size: 14px; color: #4338ca; margin: 0; font-weight: bold; uppercase;">Preparation Fluency Score</p>
                <h1 style="font-size: 48px; color: #4f46e5; margin: 10px 0;">{index}%</h1>
                <p style="font-size: 12px; color: #6366f1; margin: 0;">Top 15% of candidates this month</p>
            </div>
            <p>Your main areas of development: Dynamic Programming, speaking pace, and system designs.</p>
        </div>
        """

    elif template_type == "subscription":
        subject = "Invoice & Account Update - InterviewX AI"
        tier = context.get("tier", "Premium Candidate")
        renewal = context.get("renewal_date", "N/A")
        html_content = f"""
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #1f2937;">Subscription Invoice Receipt</h2>
            <p>Thank you for subscribing to InterviewX AI. Your account details have been successfully processed.</p>
            <p><strong>Active Tier:</strong> {tier}</p>
            <p><strong>Renewal Billing Date:</strong> {renewal}</p>
            <p>You can manage your subscription billing details in the settings center at any time.</p>
        </div>
        """

    # 2. Write to DB
    log_entry = EmailLog(
        user_id=user_id,
        recipient_email=recipient_email,
        template_type=template_type,
        subject=subject,
        sent_at=datetime.utcnow(),
        status="success",
    )
    db.add(log_entry)
    await db.commit()
    await db.refresh(log_entry)

    return {
        "id": log_entry.id,
        "recipient_email": log_entry.recipient_email,
        "template_type": log_entry.template_type,
        "subject": log_entry.subject,
        "sent_at": log_entry.sent_at.isoformat(),
        "status": log_entry.status,
        "body_preview": html_content[:200] + "...",
    }
