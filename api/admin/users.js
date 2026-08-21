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
    return res.status(500).json({ error: "Server configuration error" });
  }

  // Verify the caller is authenticated and is an admin
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

    // Check if user is admin
    const { data: profile, error: profileError } = await userSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: admin access required" });
    }

    // Use service role for the actual operation
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
        const { data: profiles } = await adminSupabase
          .from("profiles")
          .select("*");

        // Merge auth users with profiles
        const users = authUsers.users.map((u) => {
          const profile = profiles?.find((p) => p.id === u.id);
          return {
            id: u.id,
            email: u.email,
            name: profile?.name || u.user_metadata?.name || "",
            role: profile?.role || "user",
            status: profile?.status || "active",
            created_at: u.created_at,
          };
        });

        return res.status(200).json({ users });
      }

      case "POST": {
        // Create a new user
        const { email, password, name, role } = req.body;

        if (!email || !password) {
          return res
            .status(400)
            .json({ error: "Email and password are required" });
        }

        const { data: newUser, error: createError } =
          await adminSupabase.auth.admin.createUser({
            email,
            password,
            user_metadata: { name: name || "" },
            email_confirm: true, // Auto-confirm since admin is creating
          });

        if (createError) {
          return res.status(400).json({ error: createError.message });
        }

        // Update profile with role and name if specified
        const profileUpdates = {};
        if (name) profileUpdates.name = name;
        if (role && role !== "user") profileUpdates.role = role;

        if (Object.keys(profileUpdates).length > 0) {
          await adminSupabase
            .from("profiles")
            .update(profileUpdates)
            .eq("id", newUser.user.id);
        }

        return res.status(200).json({
          user: {
            id: newUser.user.id,
            email: newUser.user.email,
            name: name || "",
            role: role || "user",
          },
        });
      }

      case "PATCH": {
        // Update user role, status, or name
        const { userId, role, status, name } = req.body;

        if (!userId) {
          return res.status(400).json({ error: "userId is required" });
        }

        // Update profile
        const profileUpdates = {};
        if (role) profileUpdates.role = role;
        if (name !== undefined) profileUpdates.name = name;
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

        // Handle user enable/disable via ban
        if (status === "disabled") {
          await adminSupabase.auth.admin.updateUserById(userId, {
            ban_duration: "100y",
          });
        } else if (status === "active") {
          await adminSupabase.auth.admin.updateUserById(userId, {
            ban_duration: 0,
          });
        }

        return res.status(200).json({ success: true });
      }

      case "DELETE": {
        // Delete a user
        const { userId } = req.body;

        if (!userId) {
          return res.status(400).json({ error: "userId is required" });
        }

        // Prevent admin from deleting themselves
        if (userId === user.id) {
          return res
            .status(400)
            .json({ error: "Cannot delete your own account" });
        }

        const { error: deleteError } =
          await adminSupabase.auth.admin.deleteUser(userId);
        if (deleteError) {
          return res.status(400).json({ error: deleteError.message });
        }

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
