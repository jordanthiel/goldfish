-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create therapist_profiles table
CREATE TABLE IF NOT EXISTS public.therapist_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT,
    bio TEXT,
    specialty TEXT,
    license_number TEXT,
    years_experience INTEGER,
    profile_image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create client_profiles table
CREATE TABLE IF NOT EXISTS public.client_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    first_name TEXT,
    last_name TEXT,
    date_of_birth DATE,
    phone TEXT,
    address TEXT,
    emergency_contact TEXT,
    phi_data JSONB,
    status TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Create therapist_clients table (junction table)
CREATE TABLE IF NOT EXISTS public.therapist_clients (
    id SERIAL PRIMARY KEY,
    therapist_id UUID NOT NULL,
    client_id UUID NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT therapist_clients_therapist_id_fkey1 FOREIGN KEY (therapist_id) 
        REFERENCES public.therapist_profiles(id) ON DELETE CASCADE,
    CONSTRAINT therapist_clients_client_id_fkey1 FOREIGN KEY (client_id) 
        REFERENCES public.client_profiles(id) ON DELETE CASCADE,
    UNIQUE(therapist_id, client_id)
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    therapist_id UUID NOT NULL,
    client_id UUID NOT NULL,
    title TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT appointments_therapist_id_fkey FOREIGN KEY (therapist_id) 
        REFERENCES public.therapist_profiles(id) ON DELETE CASCADE,
    CONSTRAINT appointments_client_id_fkey FOREIGN KEY (client_id) 
        REFERENCES public.client_profiles(id) ON DELETE CASCADE
);

-- Create session_notes table
CREATE TABLE IF NOT EXISTS public.session_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID,
    client_id UUID,
    therapist_id UUID,
    content TEXT,
    is_private BOOLEAN,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    CONSTRAINT session_notes_appointment_id_fkey FOREIGN KEY (appointment_id) 
        REFERENCES public.appointments(id) ON DELETE SET NULL,
    CONSTRAINT session_notes_client_id_fkey FOREIGN KEY (client_id) 
        REFERENCES public.client_profiles(id) ON DELETE CASCADE,
    CONSTRAINT session_notes_therapist_id_fkey FOREIGN KEY (therapist_id) 
        REFERENCES public.therapist_profiles(id) ON DELETE CASCADE
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL,
    receiver_id UUID NOT NULL,
    content TEXT NOT NULL,
    is_from_user BOOLEAN NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create note_access_logs table
CREATE TABLE IF NOT EXISTS public.note_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID,
    user_id UUID,
    access_type TEXT,
    accessed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    CONSTRAINT note_access_logs_note_id_fkey FOREIGN KEY (note_id) 
        REFERENCES public.session_notes(id) ON DELETE CASCADE
);

-- Create client_invitations table
CREATE TABLE IF NOT EXISTS public.client_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    therapist_id UUID NOT NULL,
    client_id UUID NOT NULL,
    email TEXT NOT NULL,
    invite_code TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending',
    claimed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT client_invitations_therapist_id_fkey FOREIGN KEY (therapist_id) 
        REFERENCES public.therapist_profiles(id) ON DELETE CASCADE,
    CONSTRAINT client_invitations_client_id_fkey FOREIGN KEY (client_id) 
        REFERENCES public.client_profiles(id) ON DELETE CASCADE
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create billing table
CREATE TABLE IF NOT EXISTS public.billing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL,
    therapist_id UUID,
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    invoice_number TEXT,
    due_date DATE,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT billing_client_id_fkey FOREIGN KEY (client_id) 
        REFERENCES public.client_profiles(id) ON DELETE CASCADE,
    CONSTRAINT billing_therapist_id_fkey FOREIGN KEY (therapist_id) 
        REFERENCES public.therapist_profiles(id) ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_therapist_clients_therapist_id ON public.therapist_clients(therapist_id);
CREATE INDEX IF NOT EXISTS idx_therapist_clients_client_id ON public.therapist_clients(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_therapist_id ON public.appointments(therapist_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON public.appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_session_notes_client_id ON public.session_notes(client_id);
CREATE INDEX IF NOT EXISTS idx_session_notes_therapist_id ON public.session_notes(therapist_id);
CREATE INDEX IF NOT EXISTS idx_session_notes_appointment_id ON public.session_notes(appointment_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_note_access_logs_note_id ON public.note_access_logs(note_id);
CREATE INDEX IF NOT EXISTS idx_note_access_logs_user_id ON public.note_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_client_invitations_email ON public.client_invitations(email);
CREATE INDEX IF NOT EXISTS idx_client_invitations_invite_code ON public.client_invitations(invite_code);
CREATE INDEX IF NOT EXISTS idx_client_invitations_status ON public.client_invitations(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON public.audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_billing_client_id ON public.billing(client_id);
CREATE INDEX IF NOT EXISTS idx_billing_therapist_id ON public.billing(therapist_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_therapist_profiles_updated_at BEFORE UPDATE ON public.therapist_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_profiles_updated_at BEFORE UPDATE ON public.client_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billing_updated_at BEFORE UPDATE ON public.billing
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to set accessed_at when note access is logged
CREATE OR REPLACE FUNCTION set_note_access_accessed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.accessed_at IS NULL THEN
        NEW.accessed_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_note_access_logs_accessed_at BEFORE INSERT ON public.note_access_logs
    FOR EACH ROW EXECUTE FUNCTION set_note_access_accessed_at();
