-- Batch 22a — Create the claim-attachments storage bucket
--
-- Finding: WhatsApp webhook and ClaimAttachments component were both
-- trying to upload to a bucket called 'claim-attachments' that had
-- never been created. Every attachment upload was silently failing
-- at the storage step. Both paths were broken since day 1.
--
-- Private bucket (not public), 20MB file size limit matching the old
-- claim-documents bucket. Access is enforced by the API route (service
-- role) rather than by storage.objects RLS policies.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'claim-attachments',
  'claim-attachments',
  false,
  20971520,
  NULL
)
ON CONFLICT (id) DO NOTHING;
