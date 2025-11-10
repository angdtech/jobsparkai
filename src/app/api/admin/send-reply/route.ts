import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'angelinadyer@icloud.com'

export async function POST(request: NextRequest) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY
    
    if (!resendApiKey) {
      return NextResponse.json(
        { error: 'Resend API key not configured' },
        { status: 500 }
      )
    }

    const resend = new Resend(resendApiKey)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify admin user from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const { messageId, replyMessage } = await request.json()

    if (!messageId || !replyMessage) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get the original message
    const { data: message, error: messageError } = await supabase
      .from('contact_messages')
      .select('*')
      .eq('id', messageId)
      .single()

    if (messageError || !message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      )
    }

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'JobSpark AI Support <support@jobsparkai.com>',
      to: [message.email],
      replyTo: ADMIN_EMAIL,
      subject: `Re: ${message.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f97316 0%, #dc2626 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">JobSpark AI</h1>
          </div>
          
          <div style="padding: 30px; background: #f9fafb;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              ${replyMessage.replace(/\n/g, '<br>')}
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                <strong>Your original message:</strong>
              </p>
              <p style="color: #6b7280; font-size: 14px; margin-top: 10px; padding: 15px; background: white; border-left: 3px solid #f97316;">
                ${message.message.replace(/\n/g, '<br>')}
              </p>
            </div>
          </div>
          
          <div style="background: #1f2937; padding: 20px; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} JobSpark AI. All rights reserved.
            </p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json(
        { error: 'Failed to send email', details: error.message },
        { status: 500 }
      )
    }

    // Mark message as replied
    await supabase
      .from('contact_messages')
      .update({
        replied: true,
        replied_at: new Date().toISOString(),
        replied_by: user.id
      })
      .eq('id', messageId)

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error sending reply:', error)
    return NextResponse.json(
      { error: 'Failed to send reply', details: error.message },
      { status: 500 }
    )
  }
}
