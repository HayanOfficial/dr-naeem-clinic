const { createClient } = require("@supabase/supabase-js");

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    return res.status(500).json({ error: "Server configuration error: Missing environment variables" });
  }

  // Verify the caller is authenticated and is an active admin
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "No authorization header" });
  }

  try {
    // Create a Supabase client with the user's token to verify identity
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await userSupabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check if caller is an active admin
    const { data: profile, error: profileError } = await userSupabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "admin" || profile.status !== "active") {
      return res.status(403).json({ error: "Forbidden: active admin access required" });
    }

    // Use service role for the actual admin operations
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (req.method) {
      case "GET": {
        // List all users with their profiles
        const { data: authUsers, error: listError } =
          await adminSupabase.auth.admin.listUsers();
        if (listError) {
          return res.status(500).json({ error: listError.message });
        }

        // Get all profiles
        const { data: profiles, error: profilesError } = await adminSupabase
          .from("profiles")
          .select("*");

        if (profilesError) {
          return res.status(500).json({ error: profilesError.message });
        }

        // Merge auth users with profiles
        const users = (authUsers.users || []).map((u) => {
          const prof = profiles?.find((p) => p.id === u.id);
          return {
            id: u.id,
            email: u.email,
            name: prof?.name || u.user_metadata?.name || "",
            role: prof?.role || "user",
            status: prof?.status || "active",
            created_at: u.created_at,
          };
        });

        return res.status(200).json({ users });
      }

      case "POST": {
        // Create a new staff user
        const { email, password, name, role } = req.body || {};

        if (!email || !password) {
          return res
            .status(400)
            .json({ error: "Email and password are required" });
        }

        const userRole = role === "admin" ? "admin" : "user";

        const { data: newUser, error: createError } =
          await adminSupabase.auth.admin.createUser({
            email: email.trim().toLowerCase(),
            password: password,
            user_metadata: { name: (name || "").trim() },
            email_confirm: true, // Auto-confirm since admin is creating the account
          });

        if (createError) {
          return res.status(400).json({ error: createError.message });
        }

        // Upsert profile record
        await adminSupabase
          .from("profiles")
          .upsert({
            id: newUser.user.id,
            name: (name || "").trim(),
            email: email.trim().toLowerCase(),
            role: userRole,
            status: "active",
          });

        return res.status(200).json({
          user: {
            id: newUser.user.id,
            email: newUser.user.email,
            name: (name || "").trim(),
            role: userRole,
            status: "active",
          },
        });
      }

      case "PATCH": {
        // Update user role, status, name, or password
        const { userId, role, status, name, password } = req.body || {};

        if (!userId) {
          return res.status(400).json({ error: "userId is required" });
        }

        // Prevent admin from disabling or demoting themselves
        if (userId === user.id) {
          if (status === "disabled") {
            return res.status(400).json({ error: "Cannot disable your own admin account" });
          }
          if (role === "user") {
            return res.status(400).json({ error: "Cannot demote your own admin account" });
          }
        }

        // Update profile in DB
        const profileUpdates = {};
        if (role) profileUpdates.role = role;
        if (name !== undefined) profileUpdates.name = (name || "").trim();
        if (status) profileUpdates.status = status;

        if (Object.keys(profileUpdates).length > 0) {
          const { error } = await adminSupabase
            .from("profiles")
            .update(profileUpdates)
            .eq("id", userId);
          if (error) {
            return res.status(400).json({ error: error.message });
          }
        }

        // Update auth user settings (password, name metadata, ban status)
        const authUpdates = {};
        if (password) authUpdates.password = password;
        if (name !== undefined) authUpdates.user_metadata = { name: (name || "").trim() };
        if (status === "disabled") {
          authUpdates.ban_duration = "100y";
        } else if (status === "active") {
          authUpdates.ban_duration = "none";
        }

        if (Object.keys(authUpdates).length > 0) {
          const { error: authUpdateErr } = await adminSupabase.auth.admin.updateUserById(
            userId,
            authUpdates
          );
          if (authUpdateErr) {
            return res.status(400).json({ error: authUpdateErr.message });
          }
        }

        return res.status(200).json({ success: true });
      }

      case "DELETE": {
        // Delete a user account
        const { userId } = req.body || {};

        if (!userId) {
          return res.status(400).json({ error: "userId is required" });
        }

        // Prevent admin from deleting themselves
        if (userId === user.id) {
          return res
            .status(400)
            .json({ error: "Cannot delete your own admin account" });
        }

        const { error: deleteError } =
          await adminSupabase.auth.admin.deleteUser(userId);
        if (deleteError) {
          return res.status(400).json({ error: deleteError.message });
        }

        // Clean up profile if cascade didn't catch it
        await adminSupabase.from("profiles").delete().eq("id", userId);

        return res.status(200).json({ success: true });
      }

      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (err) {
    console.error("Admin API error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
