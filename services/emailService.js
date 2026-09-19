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
      (task, index) => {
        const isDormant = task.status !== 'in_progress';
        const statusLabel = isDormant ? 'Dormant' : 'In Progress';
        const statusStyle = isDormant
          ? 'background: rgba(100,107,128,0.15); color: #a3a8b8; border: 1px solid rgba(100,107,128,0.3);'
          : 'background: rgba(189,166,247,0.12); color: #d6c7fb; border: 1px solid rgba(189,166,247,0.3);';

        return `
      <tr>
        <td style="
          padding: 14px 18px;
          border-bottom: 1px solid rgba(189,166,247,0.1);
          vertical-align: top;
        ">
          <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
            <tr>
              <td style="vertical-align: top; width: 34px; padding-top: 1px;">
                <div style="
                  width: 24px;
                  height: 24px;
                  border-radius: 50%;
                  background: linear-gradient(135deg, #bda6f7 0%, #abecda 100%);
                  color: #0f1015;
                  font-size: 11px;
                  font-weight: 800;
                  line-height: 24px;
                  text-align: center;
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
                ">${index + 1}</div>
              </td>
              <td style="vertical-align: top;">
                <strong style="color: #f3f4f8; font-size: 14px;">${task.title}</strong>
                ${
                  task.description
                    ? `<p style="color: #a3a8b8; font-size: 13px; margin: 5px 0 0 0; line-height: 1.5;">${task.description}</p>`
                    : ''
                }
              </td>
            </tr>
          </table>
        </td>
        <td style="
          padding: 14px 18px;
          border-bottom: 1px solid rgba(189,166,247,0.1);
          text-align: center;
          vertical-align: middle;
          white-space: nowrap;
          width: 120px;
        ">
          <span style="
            display: inline-block;
            ${statusStyle}
            border-radius: 999px;
            padding: 3px 14px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          ">${statusLabel}</span>
        </td>
      </tr>`;
      }
    )
    .join('');

  const firstName = member.name.split(' ')[0];
  // Only include tasks that are NOT completed
  const pendingTasks = incompleteTasks.filter(t => t.status !== 'completed');
  const taskCount = pendingTasks.length;
  const taskWord = taskCount === 1 ? 'task' : 'tasks';

  // Count by sub-status for the summary
  const dormantCount    = pendingTasks.filter(t => t.status === 'dormant').length;
  const inProgressCount = pendingTasks.filter(t => t.status === 'in_progress').length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Pending Tasks Reminder - VitaSyn</title>
</head>
<body style="
  margin: 0;
  padding: 0;
  background-color: #0f1015;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  color: #f3f4f8;
">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0f1015; min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 16px;">

        <!-- Email Container -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px;">

          <!-- HEADER -->
          <tr>
            <td style="
              background: linear-gradient(135deg, #151720 0%, #1c1e2b 100%);
              border: 1px solid rgba(189,166,247,0.22);
              border-bottom: none;
              border-radius: 20px 20px 0 0;
              padding: 32px 36px 28px;
              text-align: center;
            ">
              <!-- Brand Name only (no logo/icon) -->
              <div style="margin-bottom: 20px;">
                <span style="
                  font-size: 26px;
                  font-weight: 900;
                  letter-spacing: -0.5px;
                  color: #ffffff;
                ">Vita</span><span style="
                  font-size: 26px;
                  font-weight: 900;
                  letter-spacing: -0.5px;
                  color: #bda6f7;
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

              <!-- Gradient Divider -->
              <div style="
                height: 1px;
                background: linear-gradient(90deg, transparent 0%, rgba(189,166,247,0.4) 30%, rgba(171,236,218,0.4) 70%, transparent 100%);
                margin: 0 -36px 24px;
              "></div>

              <!-- Heading -->
              <h1 style="
                margin: 0 0 10px;
                font-size: 24px;
                font-weight: 800;
                background: linear-gradient(135deg, #d6c7fb 0%, #abecda 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                letter-spacing: -0.3px;
              ">Pending Tasks Reminder</h1>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="
              background: #151720;
              border-left: 1px solid rgba(189,166,247,0.22);
              border-right: 1px solid rgba(189,166,247,0.22);
              padding: 32px 36px;
            ">

              <!-- Greeting / Main Message -->
              <p style="margin: 0 0 8px; font-size: 15px; color: #f3f4f8; line-height: 1.7;">
                Hi <strong style="
                  background: linear-gradient(135deg, #d6c7fb 0%, #abecda 100%);
                  -webkit-background-clip: text;
                  -webkit-text-fill-color: transparent;
                  background-clip: text;
                ">${firstName}</strong>,
              </p>
              <p style="margin: 0 0 28px; font-size: 14px; color: #a3a8b8; line-height: 1.7;">
                You have <strong style="color: #bda6f7;">${taskCount} pending ${taskWord}</strong>
                (${dormantCount} dormant, ${inProgressCount} in progress).
                Every task you complete brings the whole team closer to success &mdash; you've got this!
              </p>

              <!-- Task Section Heading -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px;">
                <tr>
                  <td style="width: 24px; height: 1px; background: rgba(189,166,247,0.4);"></td>
                  <td style="
                    padding: 0 12px;
                    font-size: 11px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    color: #646b80;
                    white-space: nowrap;
                    text-align: center;
                  ">Your Pending Tasks</td>
                  <td style="width: 24px; height: 1px; background: rgba(171,236,218,0.4);"></td>
                </tr>
              </table>

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
                <p style="margin: 0 0 6px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #58cfad;">Daily Motivation</p>
                <p style="margin: 0; font-size: 14px; color: #f3f4f8; line-height: 1.6; font-style: italic;">
                  "The secret of getting ahead is getting started. Mark your tasks done one by one &mdash; progress, no matter how small, is still progress!"
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
                ">Go to My Dashboard</a>
              </div>

              <p style="text-align: center; margin: 14px 0 0; font-size: 12px; color: #646b80;">
                Log in to your dashboard and mark your tasks as complete.
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
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
              <p style="margin: 0 0 12px; font-size: 11px; color: #646b80; letter-spacing: 0.5px;">VitaSyn Pvt Ltd &middot; Automated Reminder System</p>

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

You have ${incompleteTasks.length} pending task(s). Every task you complete brings the whole team closer to success - you've got this!

Your Pending Tasks:
${taskList}

Daily Motivation:
"The secret of getting ahead is getting started. Mark your tasks done one by one - progress, no matter how small, is still progress!"

Go to My Dashboard: https://vitasyn-team-todo.vercel.app/
Log in to your dashboard and mark your tasks as complete.

---
VitaSyn Team ToDo
VitaSyn Pvt Ltd - Automated Reminder System
vitasyn-team-todo.vercel.app

This is an auto-generated admin email from VitaSyn Pvt Ltd.
Please do not reply to this email. For support, contact your administrator.
`;
};

// ── Core: send reminder to a single member ────────────────────────────────────
const sendPendingTasksReminder = async (member, transporter) => {
  const incompleteTasks = member.tasks.filter((t) => t.status !== 'completed');

  if (incompleteTasks.length === 0) return false;

  const mailOptions = {
    from: `"VitaSyn Team ToDo" <${process.env.EMAIL_USER}>`,
    to: member.email,
    subject: `Pending Tasks Reminder - ${incompleteTasks.length} task${incompleteTasks.length !== 1 ? 's' : ''} awaiting completion (${member.tasks.filter(t=>t.status==='in_progress').length} in progress)`,
    text: buildEmailText(member, incompleteTasks),
    html: buildEmailHTML(member, incompleteTasks),
  };

  await transporter.sendMail(mailOptions);
  console.log(
    `[EmailService] Reminder sent to ${member.name} (${member.email}) — ${incompleteTasks.length} pending task(s)`
  );
  return true;
};

// ── Main exported function: check all members & send reminders ────────────────
const sendPendingTaskReminders = async () => {
  console.log('[EmailService] Checking members with pending tasks...');

  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('[EmailService] EMAIL_USER or EMAIL_PASS is not set in .env. Skipping email job.');
      return;
    }

    const transporter = createTransporter();

    // Verify SMTP connection
    await transporter.verify();
    console.log('[EmailService] SMTP connection verified.');

    // Fetch all members (non-admin) from MongoDB
    const members = await User.find({ role: 'member' }).select('name email tasks');

    let emailsSent = 0;
    let membersSkipped = 0;

    for (const member of members) {
      // Only email members with at least one pending (non-completed) task
      const pendingCount = member.tasks.filter((t) => t.status !== 'completed').length;

      if (pendingCount > 0) {
        try {
          await sendPendingTasksReminder(member, transporter);
          emailsSent++;
        } catch (err) {
          console.error(`[EmailService] Failed to send email to ${member.email}:`, err.message);
        }
      } else {
        membersSkipped++;
        console.log(`[EmailService] Skipped ${member.name} — no pending tasks.`);
      }
    }

    console.log(
      `[EmailService] Done. Emails sent: ${emailsSent} | Members skipped (no pending tasks): ${membersSkipped}`
    );
  } catch (err) {
    console.error('[EmailService] Email job failed:', err.message);
  }
};

module.exports = { sendPendingTaskReminders };
