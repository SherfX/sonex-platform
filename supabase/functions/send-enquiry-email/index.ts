import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

type EnquiryPayload = {
  full_name?: string
  email?: string
  phone?: string
  company?: string
  message?: string
}

async function sendResendEmail(
  apiKey: string,
  from: string,
  to: string,
  subject: string,
  html: string,
) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Resend error ${res.status}: ${text}`)
  }
  return res.json()
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get("RESEND_API_KEY")
    const from = Deno.env.get("RESEND_FROM_EMAIL") ?? "Sonex Contractors <onboarding@resend.dev>"
    const adminEmail = Deno.env.get("ADMIN_NOTIFICATION_EMAIL")

    if (!apiKey) {
      return new Response(
        JSON.stringify({ ok: false, error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      )
    }

    const payload = (await req.json()) as EnquiryPayload
    const name = payload.full_name?.trim() || "there"
    const visitorEmail = payload.email?.trim()
    const phone = payload.phone?.trim() || "—"
    const company = payload.company?.trim() || "—"
    const message = payload.message?.trim() || "—"

    const results: unknown[] = []

    if (visitorEmail) {
      results.push(
        await sendResendEmail(
          apiKey,
          from,
          visitorEmail,
          "We received your enquiry — Sonex Contractors",
          `<p>Hi ${name},</p>
           <p>Thank you for contacting Sonex Contractors. We have received your project enquiry and will be in touch shortly.</p>
           <p><strong>Your message:</strong><br/>${message.replace(/\n/g, "<br/>")}</p>
           <p>— Sonex Contractors</p>`,
        ),
      )
    }

    if (adminEmail) {
      results.push(
        await sendResendEmail(
          apiKey,
          from,
          adminEmail,
          `New project enquiry from ${name}`,
          `<p><strong>Name:</strong> ${name}</p>
           <p><strong>Email:</strong> ${visitorEmail || "—"}</p>
           <p><strong>Phone:</strong> ${phone}</p>
           <p><strong>Company:</strong> ${company}</p>
           <p><strong>Message:</strong><br/>${message.replace(/\n/g, "<br/>")}</p>`,
        ),
      )
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})