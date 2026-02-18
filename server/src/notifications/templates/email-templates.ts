export type EmailType = 
    | 'new_message'
    | 'mention'
    | 'digest'
    | 'account_activity'
    | 'password_reset'
    | 'welcome'
    | 'assignment_reminder'
    | 'grade_posted';

interface TemplateResult {
    subject: string;
    html: string;
    text: string;
}

// Brand colors and styles
const BRAND_COLORS = {
    primary: '#4F46E5',
    primaryDark: '#4338CA',
    secondary: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',
    background: '#F9FAFB',
    surface: '#FFFFFF',
    text: '#1F2937',
    textMuted: '#6B7280',
    border: '#E5E7EB',
};

const baseStyles = {
    container: `font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: ${BRAND_COLORS.background};`,
    header: `background-color: ${BRAND_COLORS.primary}; padding: 24px; text-align: center;`,
    headerText: `color: white; margin: 0; font-size: 24px; font-weight: 600;`,
    content: `background-color: ${BRAND_COLORS.surface}; padding: 32px 24px;`,
    footer: `background-color: ${BRAND_COLORS.background}; padding: 24px; text-align: center; color: ${BRAND_COLORS.textMuted}; font-size: 12px;`,
    button: `display: inline-block; background-color: ${BRAND_COLORS.primary}; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500;`,
    buttonSecondary: `display: inline-block; background-color: ${BRAND_COLORS.secondary}; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500;`,
    text: `color: ${BRAND_COLORS.text}; line-height: 1.6; margin: 0 0 16px 0;`,
    heading: `color: ${BRAND_COLORS.text}; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;`,
    subheading: `color: ${BRAND_COLORS.text}; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;`,
    card: `background-color: ${BRAND_COLORS.surface}; border: 1px solid ${BRAND_COLORS.border}; border-radius: 8px; padding: 16px; margin-bottom: 12px;`,
    badge: (color: string) => `display: inline-block; background-color: ${color}20; color: ${color}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;`,
    divider: `border: none; border-top: 1px solid ${BRAND_COLORS.border}; margin: 24px 0;`,
    link: `color: ${BRAND_COLORS.primary}; text-decoration: none;`,
    small: `color: ${BRAND_COLORS.textMuted}; font-size: 12px;`,
};

const wrapEmail = (content: string, appUrl: string): string => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>School Messaging System</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${BRAND_COLORS.background};">
    <div style="${baseStyles.container}">
        <div style="${baseStyles.header}">
            <h1 style="${baseStyles.headerText}">📚 School Messaging System</h1>
        </div>
        ${content}
        <div style="${baseStyles.footer}">
            <p style="margin: 0 0 8px 0;">This email was sent by the School Messaging System.</p>
            <p style="margin: 0;">
                <a href="${appUrl}" style="${baseStyles.link}">Visit Website</a> • 
                <a href="${appUrl}/settings/notifications" style="${baseStyles.link}">Notification Settings</a>
            </p>
        </div>
    </div>
</body>
</html>
`;

export class EmailTemplate {
    /**
     * Template for new message notifications
     */
    static getNewMessageTemplate(params: {
        recipientName: string;
        senderName: string;
        channelName: string;
        messageContent: string;
        isMention: boolean;
        appUrl: string;
    }): TemplateResult {
        const { recipientName, senderName, channelName, messageContent, isMention, appUrl } = params;
        
        const mentionBadge = isMention 
            ? `<span style="${baseStyles.badge(BRAND_COLORS.warning)}">@Mention</span>` 
            : '';
        
        const subject = isMention 
            ? `${senderName} mentioned you in ${channelName}` 
            : `New message from ${senderName} in ${channelName}`;

        const html = wrapEmail(`
            <div style="${baseStyles.content}">
                <p style="${baseStyles.text}">Hi ${recipientName},</p>
                <p style="${baseStyles.text}">
                    You have a new message ${mentionBadge}
                </p>
                
                <div style="${baseStyles.card}">
                    <p style="${baseStyles.subheading}">${senderName} in ${channelName}</p>
                    <p style="${baseStyles.text}; margin-bottom: 0;">${messageContent.substring(0, 200)}${messageContent.length > 200 ? '...' : ''}</p>
                </div>
                
                <div style="text-align: center; margin: 24px 0;">
                    <a href="${appUrl}/messaging" style="${baseStyles.button}">View Message</a>
                </div>
                
                <hr style="${baseStyles.divider}">
                
                <p style="${baseStyles.small}">
                    You're receiving this because you have email notifications enabled. 
                    <a href="${appUrl}/settings/notifications" style="${baseStyles.link}">Update preferences</a>
                </p>
            </div>
        `, appUrl);

        const text = `Hi ${recipientName},

You have a new message from ${senderName} in ${channelName}:

"${messageContent.substring(0, 200)}${messageContent.length > 200 ? '...' : ''}"

View the message: ${appUrl}/messaging

---
You're receiving this because you have email notifications enabled.
Update preferences: ${appUrl}/settings/notifications`;

        return { subject, html, text };
    }

    /**
     * Template for daily/weekly digest emails
     */
    static getDigestTemplate(params: {
        userName: string;
        unreadMessages: Array<{
            channelName: string;
            senderName: string;
            messagePreview: string;
            count: number;
        }>;
        digestType: 'daily' | 'weekly';
        appUrl: string;
    }): TemplateResult {
        const { userName, unreadMessages, digestType, appUrl } = params;
        
        const subject = `${digestType === 'daily' ? 'Daily' : 'Weekly'} Message Digest - ${unreadMessages.length} unread messages`;
        
        const totalUnread = unreadMessages.reduce((sum, m) => sum + m.count, 0);
        
        const messagesList = unreadMessages.length === 0 
            ? '<p style="${baseStyles.text}; text-align: center; color: ${BRAND_COLORS.textMuted};">No unread messages! 🎉</p>'
            : unreadMessages.map(msg => `
                <div style="${baseStyles.card}">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="${baseStyles.subheading}; margin: 0;">${msg.channelName}</span>
                        ${msg.count > 1 ? `<span style="${baseStyles.badge(BRAND_COLORS.primary)}">${msg.count} new</span>` : ''}
                    </div>
                    <p style="${baseStyles.small}; margin: 0 0 4px 0;">From ${msg.senderName}</p>
                    <p style="${baseStyles.text}; margin: 0;">${msg.messagePreview.substring(0, 100)}${msg.messagePreview.length > 100 ? '...' : ''}</p>
                </div>
            `).join('');

        const html = wrapEmail(`
            <div style="${baseStyles.content}">
                <p style="${baseStyles.text}">Hi ${userName},</p>
                
                <h2 style="${baseStyles.heading}">
                    ${digestType === 'daily' ? '📬 Daily' : '📊 Weekly'} Digest
                </h2>
                
                <p style="${baseStyles.text}">
                    You have <strong>${totalUnread}</strong> unread message${totalUnread !== 1 ? 's' : ''} 
                    across <strong>${unreadMessages.length}</strong> conversation${unreadMessages.length !== 1 ? 's' : ''}.
                </p>
                
                ${messagesList}
                
                <div style="text-align: center; margin: 24px 0;">
                    <a href="${appUrl}/messaging" style="${baseStyles.button}">View All Messages</a>
                </div>
                
                <hr style="${baseStyles.divider}">
                
                <p style="${baseStyles.small}">
                    You're receiving this ${digestType} digest because you have email notifications enabled.
                    <a href="${appUrl}/settings/notifications" style="${baseStyles.link}">Update preferences</a>
                </p>
            </div>
        `, appUrl);

        const text = `Hi ${userName},

${digestType === 'daily' ? 'Daily' : 'Weekly'} Digest

You have ${totalUnread} unread message${totalUnread !== 1 ? 's' : ''} across ${unreadMessages.length} conversation${unreadMessages.length !== 1 ? 's' : ''}.

${unreadMessages.map(msg => `
${msg.channelName}${msg.count > 1 ? ` (${msg.count} new)` : ''}
From ${msg.senderName}
"${msg.messagePreview.substring(0, 100)}${msg.messagePreview.length > 100 ? '...' : ''}"
`).join('\n---\n')}

View all messages: ${appUrl}/messaging

---
You're receiving this ${digestType} digest because you have email notifications enabled.
Update preferences: ${appUrl}/settings/notifications`;

        return { subject, html, text };
    }

    /**
     * Template for account activity alerts
     */
    static getAccountActivityTemplate(params: {
        userName: string;
        activityType: 'login' | 'password_change' | 'profile_update' | 'suspicious_activity';
        details: {
            timestamp: Date;
            ipAddress?: string;
            device?: string;
            location?: string;
        };
        appUrl: string;
    }): TemplateResult {
        const { userName, activityType, details, appUrl } = params;
        
        const activityLabels: Record<string, { subject: string; title: string; icon: string; color: string }> = {
            login: { subject: 'New login to your account', title: 'New Login Detected', icon: '🔐', color: BRAND_COLORS.secondary },
            password_change: { subject: 'Your password was changed', title: 'Password Changed', icon: '🔑', color: BRAND_COLORS.primary },
            profile_update: { subject: 'Your profile was updated', title: 'Profile Updated', icon: '👤', color: BRAND_COLORS.primary },
            suspicious_activity: { subject: 'Suspicious activity detected', title: '⚠️ Suspicious Activity', icon: '⚠️', color: BRAND_COLORS.danger },
        };
        
        const activity = activityLabels[activityType];
        const formattedTime = new Intl.DateTimeFormat('en-US', {
            dateStyle: 'full',
            timeStyle: 'short',
        }).format(details.timestamp);

        const html = wrapEmail(`
            <div style="${baseStyles.content}">
                <p style="${baseStyles.text}">Hi ${userName},</p>
                
                <div style="text-align: center; margin: 24px 0;">
                    <div style="font-size: 48px; margin-bottom: 16px;">${activity.icon}</div>
                    <h2 style="${baseStyles.heading}; color: ${activity.color};">${activity.title}</h2>
                </div>
                
                <p style="${baseStyles.text}">
                    We noticed activity on your School Messaging account:
                </p>
                
                <div style="${baseStyles.card}">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: ${BRAND_COLORS.textMuted}; width: 100px;">Time</td>
                            <td style="padding: 8px 0; font-weight: 500;">${formattedTime}</td>
                        </tr>
                        ${details.ipAddress ? `
                        <tr>
                            <td style="padding: 8px 0; color: ${BRAND_COLORS.textMuted};">IP Address</td>
                            <td style="padding: 8px 0; font-family: monospace;">${details.ipAddress}</td>
                        </tr>
                        ` : ''}
                        ${details.device ? `
                        <tr>
                            <td style="padding: 8px 0; color: ${BRAND_COLORS.textMuted};">Device</td>
                            <td style="padding: 8px 0;">${details.device}</td>
                        </tr>
                        ` : ''}
                        ${details.location ? `
                        <tr>
                            <td style="padding: 8px 0; color: ${BRAND_COLORS.textMuted};">Location</td>
                            <td style="padding: 8px 0;">${details.location}</td>
                        </tr>
                        ` : ''}
                    </table>
                </div>
                
                ${activityType === 'suspicious_activity' ? `
                <div style="background-color: ${BRAND_COLORS.danger}10; border-left: 4px solid ${BRAND_COLORS.danger}; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
                    <p style="${baseStyles.text}; margin: 0; color: ${BRAND_COLORS.danger};">
                        <strong>Action Required:</strong> If you don't recognize this activity, please secure your account immediately.
                    </p>
                </div>
                ` : ''}
                
                <div style="text-align: center; margin: 24px 0;">
                    <a href="${appUrl}/settings/security" style="${activityType === 'suspicious_activity' ? baseStyles.button : baseStyles.buttonSecondary}">
                        ${activityType === 'suspicious_activity' ? 'Secure My Account' : 'Review Account Activity'}
                    </a>
                </div>
                
                <hr style="${baseStyles.divider}">
                
                <p style="${baseStyles.small}">
                    You're receiving this security alert to help keep your account safe.
                    <a href="${appUrl}/settings/notifications" style="${baseStyles.link}">Notification settings</a>
                </p>
            </div>
        `, appUrl);

        const text = `Hi ${userName},

${activity.title}

We noticed activity on your School Messaging account:

Time: ${formattedTime}
${details.ipAddress ? `IP Address: ${details.ipAddress}\n` : ''}${details.device ? `Device: ${details.device}\n` : ''}${details.location ? `Location: ${details.location}\n` : ''}

${activityType === 'suspicious_activity' ? `⚠️ ACTION REQUIRED: If you don't recognize this activity, please secure your account immediately.` : ''}

Review account activity: ${appUrl}/settings/security

---
You're receiving this security alert to help keep your account safe.
Notification settings: ${appUrl}/settings/notifications`;

        return { subject: activity.subject, html, text };
    }

    /**
     * Template for password reset emails
     */
    static getPasswordResetTemplate(params: {
        userName: string;
        resetUrl: string;
        expiresIn: string;
        appUrl: string;
    }): TemplateResult {
        const { userName, resetUrl, expiresIn, appUrl } = params;
        
        const subject = 'Reset your password';

        const html = wrapEmail(`
            <div style="${baseStyles.content}">
                <div style="text-align: center; margin: 24px 0;">
                    <div style="font-size: 48px; margin-bottom: 16px;">🔐</div>
                    <h2 style="${baseStyles.heading}">Reset Your Password</h2>
                </div>
                
                <p style="${baseStyles.text}">Hi ${userName},</p>
                
                <p style="${baseStyles.text}">
                    We received a request to reset your password. Click the button below to create a new password:
                </p>
                
                <div style="text-align: center; margin: 32px 0;">
                    <a href="${resetUrl}" style="${baseStyles.button}">Reset Password</a>
                </div>
                
                <p style="${baseStyles.text}">
                    Or copy and paste this link into your browser:
                </p>
                <p style="${baseStyles.text}; word-break: break-all; background-color: ${BRAND_COLORS.background}; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 12px;">
                    ${resetUrl}
                </p>
                
                <div style="background-color: ${BRAND_COLORS.warning}10; border-left: 4px solid ${BRAND_COLORS.warning}; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
                    <p style="${baseStyles.text}; margin: 0;">
                        <strong>⏰ This link expires in ${expiresIn}</strong>
                    </p>
                </div>
                
                <p style="${baseStyles.text}">
                    If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                </p>
                
                <hr style="${baseStyles.divider}">
                
                <p style="${baseStyles.small}">
                    Need help? Contact support at <a href="mailto:support@schoolmessaging.com" style="${baseStyles.link}">support@schoolmessaging.com</a>
                </p>
            </div>
        `, appUrl);

        const text = `Hi ${userName},

Reset Your Password

We received a request to reset your password. Click the link below to create a new password:

${resetUrl}

⏰ This link expires in ${expiresIn}

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

---
Need help? Contact support at support@schoolmessaging.com`;

        return { subject, html, text };
    }

    /**
     * Template for welcome emails
     */
    static getWelcomeTemplate(params: {
        userName: string;
        role: string;
        appUrl: string;
    }): TemplateResult {
        const { userName, role, appUrl } = params;
        
        const roleSpecificContent: Record<string, string> = {
            teacher: 'As a teacher, you can create channels, send announcements, grade assignments, and communicate with parents and students.',
            parent: 'As a parent, you can stay connected with your child\'s teachers, receive updates, and track their academic progress.',
            student: 'As a student, you can join class channels, submit assignments, view your grades, and collaborate with classmates.',
            admin: 'As an administrator, you have full access to manage users, courses, and system settings.',
        };

        const subject = 'Welcome to School Messaging System!';

        const html = wrapEmail(`
            <div style="${baseStyles.content}">
                <div style="text-align: center; margin: 24px 0;">
                    <div style="font-size: 48px; margin-bottom: 16px;">🎓</div>
                    <h2 style="${baseStyles.heading}">Welcome to School Messaging!</h2>
                </div>
                
                <p style="${baseStyles.text}">Hi ${userName},</p>
                
                <p style="${baseStyles.text}">
                    Welcome to your school's messaging platform! We're excited to have you on board.
                </p>
                
                <div style="${baseStyles.card}">
                    <p style="${baseStyles.text}; margin: 0;">
                        ${roleSpecificContent[role] || roleSpecificContent.student}
                    </p>
                </div>
                
                <h3 style="${baseStyles.subheading}">Get Started:</h3>
                
                <table style="width: 100%; margin: 16px 0;">
                    <tr>
                        <td style="padding: 8px;">💬</td>
                        <td style="padding: 8px;"><strong>Join conversations</strong> in your class channels</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px;">📁</td>
                        <td style="padding: 8px;"><strong>Share files</strong> and course materials</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px;">📅</td>
                        <td style="padding: 8px;"><strong>Stay updated</strong> with announcements</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px;">🔔</td>
                        <td style="padding: 8px;"><strong>Customize notifications</strong> to your preference</td>
                    </tr>
                </table>
                
                <div style="text-align: center; margin: 32px 0;">
                    <a href="${appUrl}/messaging" style="${baseStyles.button}">Get Started</a>
                </div>
                
                <hr style="${baseStyles.divider}">
                
                <p style="${baseStyles.small}">
                    Need help getting started? Check out our <a href="${appUrl}/help" style="${baseStyles.link}">Help Center</a> or 
                    contact support at <a href="mailto:support@schoolmessaging.com" style="${baseStyles.link}">support@schoolmessaging.com</a>
                </p>
            </div>
        `, appUrl);

        const text = `Welcome to School Messaging!

Hi ${userName},

Welcome to your school's messaging platform! We're excited to have you on board.

${roleSpecificContent[role] || roleSpecificContent.student}

Get Started:
- 💬 Join conversations in your class channels
- 📁 Share files and course materials  
- 📅 Stay updated with announcements
- 🔔 Customize notifications to your preference

Get Started: ${appUrl}/messaging

---
Need help getting started? Check out our Help Center or contact support at support@schoolmessaging.com`;

        return { subject, html, text };
    }
}
