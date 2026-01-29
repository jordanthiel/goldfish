-- Function to generate an invite code
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
BEGIN
    -- Generate a random alphanumeric code
    code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 12));
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to verify an invite code
CREATE OR REPLACE FUNCTION public.verify_invite_code(invite_code_param TEXT)
RETURNS JSON AS $$
DECLARE
    invitation_record RECORD;
    result JSON;
BEGIN
    SELECT * INTO invitation_record
    FROM public.client_invitations
    WHERE invite_code = invite_code_param
    AND status = 'pending'
    AND claimed = FALSE
    AND expires_at > NOW();
    
    IF invitation_record IS NULL THEN
        RETURN json_build_object(
            'success', FALSE,
            'message', 'Invalid or expired invitation code'
        );
    END IF;
    
    RETURN json_build_object(
        'success', TRUE,
        'invitation', row_to_json(invitation_record)
    );
END;
$$ LANGUAGE plpgsql;

-- Function to create a client invitation
CREATE OR REPLACE FUNCTION public.create_client_invitation(
    therapist_id_param UUID,
    client_id_param UUID,
    email_param TEXT
)
RETURNS JSON AS $$
DECLARE
    invite_code_val TEXT;
    invitation_id UUID;
    expires_at_val TIMESTAMPTZ;
    result JSON;
BEGIN
    -- Generate invite code
    invite_code_val := public.generate_invite_code();
    
    -- Set expiration to 30 days from now
    expires_at_val := NOW() + INTERVAL '30 days';
    
    -- Insert invitation
    INSERT INTO public.client_invitations (
        therapist_id,
        client_id,
        email,
        invite_code,
        status,
        claimed,
        expires_at
    ) VALUES (
        therapist_id_param,
        client_id_param,
        email_param,
        invite_code_val,
        'pending',
        FALSE,
        expires_at_val
    ) RETURNING id INTO invitation_id;
    
    RETURN json_build_object(
        'success', TRUE,
        'invitation_id', invitation_id,
        'invite_code', invite_code_val,
        'expires_at', expires_at_val
    );
END;
$$ LANGUAGE plpgsql;

-- Function to accept a client invitation
CREATE OR REPLACE FUNCTION public.accept_client_invitation(
    invite_code_param TEXT,
    user_id_param UUID
)
RETURNS JSON AS $$
DECLARE
    invitation_record RECORD;
    client_record RECORD;
BEGIN
    -- Verify and get invitation
    SELECT * INTO invitation_record
    FROM public.client_invitations
    WHERE invite_code = invite_code_param
    AND status = 'pending'
    AND claimed = FALSE
    AND expires_at > NOW();
    
    IF invitation_record IS NULL THEN
        RETURN json_build_object(
            'success', FALSE,
            'message', 'Invalid or expired invitation code'
        );
    END IF;
    
    -- Get client profile
    SELECT * INTO client_record
    FROM public.client_profiles
    WHERE id = invitation_record.client_id;
    
    IF client_record IS NULL THEN
        RETURN json_build_object(
            'success', FALSE,
            'message', 'Client profile not found'
        );
    END IF;
    
    -- Update client profile with user_id
    UPDATE public.client_profiles
    SET user_id = user_id_param,
        updated_at = NOW()
    WHERE id = invitation_record.client_id;
    
    -- Mark invitation as claimed
    UPDATE public.client_invitations
    SET claimed = TRUE,
        status = 'accepted'
    WHERE id = invitation_record.id;
    
    RETURN json_build_object(
        'success', TRUE,
        'message', 'Invitation accepted successfully',
        'client_id', invitation_record.client_id
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get user roles
CREATE OR REPLACE FUNCTION public.get_user_roles(user_id_param UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    role TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ur.id,
        ur.user_id,
        ur.role,
        ur.created_at,
        ur.updated_at
    FROM public.user_roles ur
    WHERE ur.user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.user_has_role(
    user_id_param UUID,
    role_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    role_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO role_count
    FROM public.user_roles
    WHERE user_id = user_id_param
    AND role = role_name;
    
    RETURN role_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to add role to user
CREATE OR REPLACE FUNCTION public.add_role_to_user(
    user_id_param UUID,
    role_name TEXT
)
RETURNS TEXT AS $$
DECLARE
    role_id UUID;
BEGIN
    -- Check if role already exists
    IF EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = user_id_param
        AND role = role_name
    ) THEN
        RETURN 'Role already exists for this user';
    END IF;
    
    -- Insert new role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (user_id_param, role_name)
    RETURNING id::TEXT INTO role_id;
    
    RETURN role_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get client user info
CREATE OR REPLACE FUNCTION public.get_client_user_info(client_id_param UUID)
RETURNS JSON AS $$
DECLARE
    client_record RECORD;
    user_email TEXT;
    user_created_at TIMESTAMPTZ;
BEGIN
    -- Get client profile
    SELECT * INTO client_record
    FROM public.client_profiles
    WHERE id = client_id_param;
    
    IF client_record IS NULL THEN
        RETURN json_build_object(
            'success', FALSE,
            'message', 'Client not found'
        );
    END IF;
    
    -- Get user info if user_id exists
    -- Note: Accessing auth.users requires SECURITY DEFINER and proper permissions
    IF client_record.user_id IS NOT NULL THEN
        BEGIN
            SELECT email, created_at INTO user_email, user_created_at
            FROM auth.users
            WHERE id = client_record.user_id;
            
            RETURN json_build_object(
                'success', TRUE,
                'client', row_to_json(client_record),
                'user', json_build_object(
                    'id', client_record.user_id,
                    'email', user_email,
                    'created_at', user_created_at
                )
            );
        EXCEPTION WHEN OTHERS THEN
            -- If we can't access auth.users, just return client info
            RETURN json_build_object(
                'success', TRUE,
                'client', row_to_json(client_record),
                'user', json_build_object('id', client_record.user_id)
            );
        END;
    ELSE
        RETURN json_build_object(
            'success', TRUE,
            'client', row_to_json(client_record),
            'user', NULL
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create client with user
CREATE OR REPLACE FUNCTION public.create_client_with_user(
    therapist_id_param UUID,
    first_name_param TEXT,
    last_name_param TEXT,
    email_param TEXT,
    phone_param TEXT DEFAULT NULL,
    address_param TEXT DEFAULT NULL,
    emergency_contact_param TEXT DEFAULT NULL,
    status_param TEXT DEFAULT 'active',
    phi_data_param JSONB DEFAULT NULL,
    consent_date_param TEXT DEFAULT NULL,
    consent_version_param TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    new_client_id UUID;
    new_user_id UUID;
    user_data JSONB;
    result JSON;
BEGIN
    -- Create user in auth.users (this would typically be done via Supabase Auth API)
    -- For now, we'll create the client profile and return instructions
    -- In production, you'd use Supabase Admin API to create the user
    
    -- Create client profile
    INSERT INTO public.client_profiles (
        first_name,
        last_name,
        phone,
        address,
        emergency_contact,
        status,
        phi_data
    ) VALUES (
        first_name_param,
        last_name_param,
        phone_param,
        address_param,
        emergency_contact_param,
        status_param,
        phi_data_param
    ) RETURNING id INTO new_client_id;
    
    -- Create therapist-client relationship
    INSERT INTO public.therapist_clients (
        therapist_id,
        client_id,
        status
    ) VALUES (
        therapist_id_param,
        new_client_id,
        'active'
    );
    
    RETURN json_build_object(
        'success', TRUE,
        'client_id', new_client_id,
        'message', 'Client created. User account should be created separately via Auth API.'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to send client invitation email (placeholder - actual email sending would be via edge function)
CREATE OR REPLACE FUNCTION public.send_client_invitation_email(invite_id UUID)
RETURNS JSON AS $$
DECLARE
    invitation_record RECORD;
BEGIN
    SELECT * INTO invitation_record
    FROM public.client_invitations
    WHERE id = invite_id;
    
    IF invitation_record IS NULL THEN
        RETURN json_build_object(
            'success', FALSE,
            'message', 'Invitation not found'
        );
    END IF;
    
    -- In production, this would trigger an edge function to send the email
    -- For now, just return success
    RETURN json_build_object(
        'success', TRUE,
        'message', 'Email sending triggered (implement via edge function)',
        'invitation', row_to_json(invitation_record)
    );
END;
$$ LANGUAGE plpgsql;
