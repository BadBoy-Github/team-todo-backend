const nodemailer = require('nodemailer');
const User = require('../models/User');

// ── Nodemailer Transporter ────────────────────────────────────────────────────
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// ── HTML Email Template ───────────────────────────────────────────────────────
const buildEmailHTML = (member, incompleteTasks) => {
  const taskRows = incompleteTasks
    .map(
      (task, index) => `
      <tr>
        <td style="
          padding: 14px 18px;
          border-bottom: 1px solid rgba(189,166,247,0.1);
          vertical-align: top;
        ">
          <span style="
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: linear-gradient(135deg, #bda6f7 0%, #abecda 100%);
            color: #0f1015;
            font-size: 11px;
            font-weight: 800;
            margin-right: 10px;
            vertical-align: middle;
          ">${index + 1}</span>
          <strong style="color: #f3f4f8; font-size: 14px; vertical-align: middle;">${task.title}</strong>
          ${
            task.description
              ? `<p style="color: #a3a8b8; font-size: 13px; margin: 6px 0 0 34px; line-height: 1.5;">${task.description}</p>`
              : ''
          }
        </td>
        <td style="
          padding: 14px 18px;
          border-bottom: 1px solid rgba(189,166,247,0.1);
          text-align: center;
          vertical-align: middle;
          white-space: nowrap;
        ">
          <span style="
            display: inline-block;
            background: rgba(88,207,173,0.1);
            color: #58cfad;
            border: 1px solid rgba(88,207,173,0.3);
            border-radius: 999px;
            padding: 3px 14px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          ">⏳ Pending</span>
        </td>
      </tr>`
    )
    .join('');

  const firstName = member.name.split(' ')[0];
  const taskCount = incompleteTasks.length;
  const taskWord = taskCount === 1 ? 'task' : 'tasks';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Pending Tasks Reminder – VitaSyn</title>
</head>
<body style="
  margin: 0;
  padding: 0;
  background-color: #0f1015;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  color: #f3f4f8;
">
  <!-- Ambient background layer -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0f1015; min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 16px;">

        <!-- Email Container -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px;">

          <!-- ── HEADER ── -->
          <tr>
            <td style="
              background: linear-gradient(135deg, #151720 0%, #1c1e2b 100%);
              border: 1px solid rgba(189,166,247,0.22);
              border-bottom: none;
              border-radius: 20px 20px 0 0;
              padding: 32px 36px 28px;
              text-align: center;
              position: relative;
            ">
              <!-- Logo + Brand -->
              <div style="margin-bottom: 20px;">
                <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                  <tr>
                    <td style="vertical-align: middle; padding-right: 12px;">
                      <div style="
                        width: 48px;
                        height: 48px;
                        border-radius: 14px;
                        background: rgba(189,166,247,0.08);
                        border: 1px solid rgba(189,166,247,0.3);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0 0 20px rgba(189,166,247,0.2);
                      ">
                        <!-- VS Monogram -->
                        <span style="
                          font-size: 18px;
                          font-weight: 900;
                          background: linear-gradient(135deg, #bda6f7 0%, #abecda 100%);
                          -webkit-background-clip: text;
                          -webkit-text-fill-color: transparent;
                          background-clip: text;
                          line-height: 1;
                        ">VS</span>
                      </div>
                    </td>
                    <td style="vertical-align: middle;">
                      <div style="text-align: left; line-height: 1;">
                        <span style="
                          font-size: 26px;
                          font-weight: 900;
                          letter-spacing: -0.5px;
                          color: #ffffff;
                        ">Vita</span><span style="
                          font-size: 26px;
                          font-weight: 900;
                          letter-spacing: -0.5px;
                          background: linear-gradient(135deg, #bda6f7 0%, #9374eb 100%);
                          -webkit-background-clip: text;
                          -webkit-text-fill-color: transparent;
                          background-clip: text;
                        ">Syn</span>
                        <br/>
                        <span style="
                          font-size: 9px;
                          font-weight: 800;
                          text-transform: uppercase;
                          letter-spacing: 2.5px;
                          color: #646b80;
                        ">VitaSyn Pvt Ltd</span>
                      </div>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Gradient Divider -->
              <div style="
                height: 1px;
                background: linear-gradient(90deg, transparent 0%, rgba(189,166,247,0.4) 30%, rgba(171,236,218,0.4) 70%, transparent 100%);
                margin: 0 -36px 24px;
              "></div>

              <!-- Alert Icon -->
              <div style="
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 64px;
                height: 64px;
                border-radius: 20px;
                background: linear-gradient(135deg, rgba(189,166,247,0.15) 0%, rgba(171,236,218,0.08) 100%);
                border: 1px solid rgba(189,166,247,0.3);
                box-shadow: 0 0 28px rgba(189,166,247,0.2);
                margin-bottom: 18px;
              ">
                <span style="font-size: 28px;">📋</span>
              </div>

              <h1 style="
                margin: 0 0 10px;
                font-size: 24px;
                font-weight: 800;
                background: linear-gradient(135deg, #d6c7fb 0%, #abecda 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                letter-spacing: -0.3px;
              ">You have pending tasks, ${firstName}!</h1>

              <p style="
                margin: 0;
                font-size: 14px;
                color: #a3a8b8;
                line-height: 1.6;
              ">
                This is your daily task reminder from <strong style="color: #bda6f7;">VitaSyn Team ToDo</strong>.<br/>
                You currently have <strong style="color: #abecda;">${taskCount} pending ${taskWord}</strong> waiting for your attention.
              </p>
            </td>
          </tr>

          <!-- ── BODY ── -->
          <tr>
            <td style="
              background: #151720;
              border-left: 1px solid rgba(189,166,247,0.22);
              border-right: 1px solid rgba(189,166,247,0.22);
              padding: 32px 36px;
            ">

              <!-- Greeting -->
              <p style="margin: 0 0 24px; font-size: 15px; color: #f3f4f8; line-height: 1.7;">
                Hey <strong style="
                  background: linear-gradient(135deg, #d6c7fb 0%, #abecda 100%);
                  -webkit-background-clip: text;
                  -webkit-text-fill-color: transparent;
                  background-clip: text;
                ">${firstName}</strong> 👋,
              </p>
              <p style="margin: 0 0 28px; font-size: 14px; color: #a3a8b8; line-height: 1.7;">
                We noticed you still have <strong style="color: #bda6f7;">${taskCount} incomplete ${taskWord}</strong> on your dashboard. 
                Every task you complete brings the whole team closer to success — you've got this! 💪
              </p>

              <!-- Stats Summary Card -->
              <div style="
                background: linear-gradient(135deg, rgba(189,166,247,0.06) 0%, rgba(171,236,218,0.04) 100%);
                border: 1px solid rgba(189,166,247,0.2);
                border-radius: 16px;
                padding: 20px 24px;
                margin-bottom: 28px;
                text-align: center;
              ">
                <p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #646b80;">Pending Tasks Count</p>
                <p style="margin: 0; font-size: 42px; font-weight: 900; background: linear-gradient(135deg, #bda6f7 0%, #abecda 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; line-height: 1.1;">${taskCount}</p>
                <p style="margin: 4px 0 0; font-size: 13px; color: #a3a8b8;">task${taskCount !== 1 ? 's' : ''} awaiting completion</p>
              </div>

              <!-- Task Section Heading -->
              <p style="
                margin: 0 0 12px;
                font-size: 12px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 2px;
                color: #646b80;
                display: flex;
                align-items: center;
                gap: 8px;
              ">
                <span style="display: inline-block; width: 24px; height: 1px; background: rgba(189,166,247,0.4); vertical-align: middle; margin-right: 8px;"></span>
                Your Pending Tasks
                <span style="display: inline-block; width: 24px; height: 1px; background: rgba(171,236,218,0.4); vertical-align: middle; margin-left: 8px;"></span>
              </p>

              <!-- Tasks Table -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="
                background: #191b26;
                border: 1px solid rgba(189,166,247,0.12);
                border-radius: 16px;
                overflow: hidden;
                margin-bottom: 28px;
              ">
                <!-- Table Head -->
                <tr style="background: linear-gradient(90deg, rgba(189,166,247,0.08) 0%, rgba(171,236,218,0.05) 100%);">
                  <th style="
                    padding: 12px 18px;
                    text-align: left;
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    color: #646b80;
                    border-bottom: 1px solid rgba(189,166,247,0.12);
                  ">Task</th>
                  <th style="
                    padding: 12px 18px;
                    text-align: center;
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    color: #646b80;
                    border-bottom: 1px solid rgba(189,166,247,0.12);
                    width: 120px;
                  ">Status</th>
                </tr>
                ${taskRows}
              </table>

              <!-- Motivational Quote -->
              <div style="
                background: linear-gradient(135deg, rgba(171,236,218,0.07) 0%, rgba(189,166,247,0.04) 100%);
                border: 1px solid rgba(171,236,218,0.18);
                border-left: 3px solid #abecda;
                border-radius: 0 12px 12px 0;
                padding: 16px 20px;
                margin-bottom: 28px;
              ">
                <p style="margin: 0 0 6px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #58cfad;">✨ Daily Motivation</p>
                <p style="margin: 0; font-size: 14px; color: #f3f4f8; line-height: 1.6; font-style: italic;">
                  "The secret of getting ahead is getting started. Mark your tasks done one by one — progress, no matter how small, is still progress!"
                </p>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin-bottom: 8px;">
                <a href="https://vitasyn-team-todo.vercel.app/" style="
                  display: inline-block;
                  background: linear-gradient(135deg, #bda6f7 0%, #abecda 100%);
                  color: #0f1015;
                  font-size: 14px;
                  font-weight: 800;
                  text-decoration: none;
                  padding: 14px 36px;
                  border-radius: 14px;
                  letter-spacing: 0.3px;
                  box-shadow: 0 4px 20px rgba(189,166,247,0.3), 0 2px 8px rgba(171,236,218,0.2);
                ">🚀 Go to My Dashboard</a>
              </div>

              <p style="text-align: center; margin: 14px 0 0; font-size: 12px; color: #646b80;">
                Log in to your dashboard and mark your tasks as complete.
              </p>
            </td>
          </tr>

          <!-- ── FOOTER ── -->
          <tr>
            <td style="
              background: linear-gradient(135deg, #151720 0%, #1c1e2b 100%);
              border: 1px solid rgba(189,166,247,0.22);
              border-top: none;
              border-radius: 0 0 20px 20px;
              padding: 24px 36px;
              text-align: center;
            ">
              <!-- Gradient Divider -->
              <div style="
                height: 1px;
                background: linear-gradient(90deg, transparent 0%, rgba(189,166,247,0.3) 30%, rgba(171,236,218,0.3) 70%, transparent 100%);
                margin: 0 0 20px;
              "></div>

              <!-- Company Info -->
              <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #a3a8b8;">
                <span style="color: #ffffff;">Vita</span><span style="color: #bda6f7;">Syn</span> Team ToDo
              </p>
              <p style="margin: 0 0 12px; font-size: 11px; color: #646b80; letter-spacing: 0.5px;">VitaSyn Pvt Ltd · Automated Reminder System</p>

              <a href="https://vitasyn-team-todo.vercel.app/" style="
                display: inline-block;
                font-size: 12px;
                color: #bda6f7;
                text-decoration: none;
                border-bottom: 1px solid rgba(189,166,247,0.3);
                padding-bottom: 1px;
                margin-bottom: 16px;
              ">vitasyn-team-todo.vercel.app</a>

              <!-- Disclaimer -->
              <p style="margin: 0; font-size: 11px; color: #646b80; line-height: 1.6;">
                This is an <strong style="color: #a3a8b8;">auto-generated admin email</strong> from VitaSyn Pvt Ltd.<br/>
                Please do not reply to this email. For support, contact your administrator.
              </p>
            </td>
          </tr>

        </table>
        <!-- End Email Container -->

      </td>
    </tr>
  </table>
</body>
</html>`;
};

// ── Plain-text fallback ───────────────────────────────────────────────────────
const buildEmailText = (member, incompleteTasks) => {
  const taskList = incompleteTasks
    .map((t, i) => `  ${i + 1}. ${t.title}${t.description ? `\n     ${t.description}` : ''}`)
    .join('\n');

  return `Hi ${member.name},

You have ${incompleteTasks.length} pending task(s) on VitaSyn Team ToDo:

${taskList}

Please log in and complete your tasks:
https://vitasyn-team-todo.vercel.app/

Keep up the great work!

---
This is an auto-generated admin email from VitaSyn Pvt Ltd.
VitaSyn Team ToDo | https://vitasyn-team-todo.vercel.app/
`;
};

// ── Core: send reminder to a single member ────────────────────────────────────
const sendPendingTasksReminder = async (member, transporter) => {
  const incompleteTasks = member.tasks.filter((t) => t.status === 'incomplete');

  if (incompleteTasks.length === 0) return false; // nothing to send

  const mailOptions = {
    from: `"VitaSyn Team ToDo 📋" <${process.env.EMAIL_USER}>`,
    to: member.email,
    subject: `⏳ You have ${incompleteTasks.length} pending task${incompleteTasks.length !== 1 ? 's' : ''} – VitaSyn ToDo`,
    text: buildEmailText(member, incompleteTasks),
    html: buildEmailHTML(member, incompleteTasks),
  };

  await transporter.sendMail(mailOptions);
  console.log(
    `[EmailService] ✅ Reminder sent to ${member.name} (${member.email}) — ${incompleteTasks.length} pending task(s)`
  );
  return true;
};

// ── Main exported function: check all members & send reminders ────────────────
const sendPendingTaskReminders = async () => {
  console.log('[EmailService] 🔍 Checking members with pending tasks...');

  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('[EmailService] ⚠️  EMAIL_USER or EMAIL_PASS is not set in .env. Skipping email job.');
      return;
    }

    const transporter = createTransporter();

    // Verify SMTP connection
    await transporter.verify();
    console.log('[EmailService] 📬 SMTP connection verified.');

    // Fetch all members (non-admin) from MongoDB
    const members = await User.find({ role: 'member' }).select('name email tasks');

    let emailsSent = 0;
    let membersSkipped = 0;

    for (const member of members) {
      const pendingCount = member.tasks.filter((t) => t.status === 'incomplete').length;

      if (pendingCount > 0) {
        try {
          await sendPendingTasksReminder(member, transporter);
          emailsSent++;
        } catch (err) {
          console.error(`[EmailService] ❌ Failed to send email to ${member.email}:`, err.message);
        }
      } else {
        membersSkipped++;
        console.log(`[EmailService] ⏭️  Skipped ${member.name} — no pending tasks.`);
      }
    }

    console.log(
      `[EmailService] 📊 Done. Emails sent: ${emailsSent} | Members skipped (no pending tasks): ${membersSkipped}`
    );
  } catch (err) {
    console.error('[EmailService] ❌ Email job failed:', err.message);
  }
};

module.exports = { sendPendingTaskReminders };
