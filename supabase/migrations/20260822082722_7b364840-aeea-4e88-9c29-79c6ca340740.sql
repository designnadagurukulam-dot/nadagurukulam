CREATE TABLE public.kyc_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  document_type text not null,
  custom_type text,
  document_number text,
  file_url text,
  file_name text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kyc_documents TO authenticated;
GRANT ALL ON public.kyc_documents TO service_role;

ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage kyc documents" ON public.kyc_documents
  FOR ALL TO authenticated
  USING (public.is_super_or_admin(auth.uid()))
  WITH CHECK (public.is_super_or_admin(auth.uid()));

CREATE POLICY "Users view own kyc documents" ON public.kyc_documents
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER trg_kyc_documents_updated_at BEFORE UPDATE ON public.kyc_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_kyc_documents_user ON public.kyc_documents(user_id);

-- Preserve existing KYC data from profiles
INSERT INTO public.kyc_documents (user_id, document_type, document_number, file_url)
SELECT user_id, 'Aadhaar Card', aadhar_number, NULL FROM public.profiles WHERE aadhar_number IS NOT NULL AND aadhar_number <> '';
INSERT INTO public.kyc_documents (user_id, document_type, document_number, file_url)
SELECT user_id, 'PAN Card', pan_number, NULL FROM public.profiles WHERE pan_number IS NOT NULL AND pan_number <> '';
INSERT INTO public.kyc_documents (user_id, document_type, document_number, file_url)
SELECT user_id, 'Passport', passport_number, NULL FROM public.profiles WHERE passport_number IS NOT NULL AND passport_number <> '';
INSERT INTO public.kyc_documents (user_id, document_type, custom_type, document_number, file_url)
SELECT user_id, 'Others', kyc_document_type, kyc_document_number, kyc_document_url FROM public.profiles WHERE (kyc_document_type IS NOT NULL AND kyc_document_type <> '') OR (kyc_document_url IS NOT NULL AND kyc_document_url <> '');

-- Allow admins to upload/manage KYC files in storage
CREATE POLICY "Admins upload kyc files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'kyc-documents' AND public.is_super_or_admin(auth.uid()));