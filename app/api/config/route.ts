import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { dbMinimal } from "@/lib/db-minimal";
import { appSettings } from "@/shared/schema-tables";

// Configuration structure for claude-code integration
interface ClaudeCodeConfig {
  plugins: {
    browser: {
      enabled: boolean;
      features: {
        screenshot: boolean;
        debugging: boolean;
        audit: boolean;
      };
    };
    ai: {
      enabled: boolean;
      features: {
        chat: boolean;
        suggestions: boolean;
        automation: boolean;
      };
    };
    calendar: {
      enabled: boolean;
      features: {
        sync: boolean;
        notifications: boolean;
        integration: boolean;
      };
    };
    tasks: {
      enabled: boolean;
      features: {
        autoComplete: boolean;
        smartSuggestions: boolean;
        deadlineReminders: boolean;
      };
    };
  };
  general: {
    theme: "dark" | "light" | "auto";
    autoSave: boolean;
    notifications: boolean;
    debugMode: boolean;
  };
}

// Default configuration
const DEFAULT_CONFIG: ClaudeCodeConfig = {
  plugins: {
    browser: {
      enabled: true,
      features: {
        screenshot: true,
        debugging: true,
        audit: true,
      },
    },
    ai: {
      enabled: true,
      features: {
        chat: true,
        suggestions: true,
        automation: false,
      },
    },
    calendar: {
      enabled: true,
      features: {
        sync: true,
        notifications: true,
        integration: true,
      },
    },
    tasks: {
      enabled: true,
      features: {
        autoComplete: true,
        smartSuggestions: true,
        deadlineReminders: true,
      },
    },
  },
  general: {
    theme: "dark",
    autoSave: true,
    notifications: true,
    debugMode: false,
  },
};

/**
 * Get user configuration from database
 * Returns default config if no user settings exist
 */
async function getUserConfig(userId: string): Promise<ClaudeCodeConfig> {
  try {
    const settings = await dbMinimal.query.appSettings.findFirst({
      where: eq(appSettings.userId, userId),
    });

    if (!settings || !settings.config) {
      return DEFAULT_CONFIG;
    }

    // Merge with defaults to ensure all keys exist (for backwards compatibility)
    return {
      plugins: {
        browser: {
          ...DEFAULT_CONFIG.plugins.browser,
          ...(settings.config as any).plugins?.browser,
          features: {
            ...DEFAULT_CONFIG.plugins.browser.features,
            ...(settings.config as any).plugins?.browser?.features,
          },
        },
        ai: {
          ...DEFAULT_CONFIG.plugins.ai,
          ...(settings.config as any).plugins?.ai,
          features: {
            ...DEFAULT_CONFIG.plugins.ai.features,
            ...(settings.config as any).plugins?.ai?.features,
          },
        },
        calendar: {
          ...DEFAULT_CONFIG.plugins.calendar,
          ...(settings.config as any).plugins?.calendar,
          features: {
            ...DEFAULT_CONFIG.plugins.calendar.features,
            ...(settings.config as any).plugins?.calendar?.features,
          },
        },
        tasks: {
          ...DEFAULT_CONFIG.plugins.tasks,
          ...(settings.config as any).plugins?.tasks,
          features: {
            ...DEFAULT_CONFIG.plugins.tasks.features,
            ...(settings.config as any).plugins?.tasks?.features,
          },
        },
      },
      general: {
        ...DEFAULT_CONFIG.general,
        ...(settings.config as any).general,
      },
    } as ClaudeCodeConfig;
  } catch (error) {
    console.error("Error fetching user config:", error);
    return DEFAULT_CONFIG;
  }
}

/**
 * Save user configuration to database
 * Uses upsert to create or update existing settings
 */
async function saveUserConfig(
  userId: string,
  config: ClaudeCodeConfig
): Promise<boolean> {
  try {
    await dbMinimal
      .insert(appSettings)
      .values({
        userId,
        config: config as any,
      })
      .onConflictDoUpdate({
        target: appSettings.userId,
        set: {
          config: config as any,
        },
      });

    return true;
  } catch (error) {
    console.error("Error saving user config:", error);
    return false;
  }
}

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const config = await getUserConfig(session.user.id);

    return NextResponse.json({
      config,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error("Configuration fetch failed", {
      errorId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        error: "Failed to fetch configuration",
        errorId,
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { path, value } = body;

    if (!path || value === undefined) {
      return NextResponse.json(
        { error: "Path and value are required" },
        { status: 400 }
      );
    }

    // Get current config
    const currentConfig = await getUserConfig(session.user.id);

    // Deep clone to avoid mutations
    const updatedConfig = JSON.parse(JSON.stringify(currentConfig));

    // Update specific path (e.g., "plugins.browser.enabled")
    const pathParts = path.split(".");
    let target: Record<string, any> = updatedConfig;

    // Navigate to parent object
    for (let i = 0; i < pathParts.length - 1; i++) {
      const key = pathParts[i];
      if (!target || typeof target !== "object" || !(key in target)) {
        return NextResponse.json(
          { error: `Invalid configuration path: ${path}` },
          { status: 400 }
        );
      }
      target = target[key];
    }

    // Set the value
    const finalKey = pathParts[pathParts.length - 1];
    if (!target || typeof target !== "object" || !(finalKey in target)) {
      return NextResponse.json(
        { error: `Invalid configuration key: ${finalKey}` },
        { status: 400 }
      );
    }

    target[finalKey] = value;

    // Save updated config
    const success = await saveUserConfig(session.user.id, updatedConfig);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to save configuration" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      config: updatedConfig,
      updated: path,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error("Configuration update failed", {
      errorId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        error: "Failed to update configuration",
        errorId,
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "reset":
        // Reset to default configuration
        const success = await saveUserConfig(session.user.id, DEFAULT_CONFIG);
        if (!success) {
          return NextResponse.json(
            { error: "Failed to reset configuration" },
            { status: 500 }
          );
        }
        return NextResponse.json({
          success: true,
          config: DEFAULT_CONFIG,
          message: "Configuration reset to defaults",
          timestamp: new Date().toISOString(),
        });

      case "export":
        // Export current configuration
        const config = await getUserConfig(session.user.id);
        return NextResponse.json({
          success: true,
          export: config,
          timestamp: new Date().toISOString(),
        });

      case "import":
        // Import configuration (validate first)
        const { config: importConfig } = body;
        if (!importConfig) {
          return NextResponse.json(
            { error: "Configuration data required for import" },
            { status: 400 }
          );
        }

        // Basic validation of config structure
        if (
          !importConfig.plugins ||
          !importConfig.general ||
          typeof importConfig.plugins !== "object" ||
          typeof importConfig.general !== "object"
        ) {
          return NextResponse.json(
            { error: "Invalid configuration format" },
            { status: 400 }
          );
        }

        // Validate theme value
        const validThemes = ["dark", "light", "auto"];
        if (
          importConfig.general.theme &&
          !validThemes.includes(importConfig.general.theme)
        ) {
          return NextResponse.json(
            { error: "Invalid theme value. Must be 'dark', 'light', or 'auto'" },
            { status: 400 }
          );
        }

        const importSuccess = await saveUserConfig(
          session.user.id,
          importConfig
        );
        if (!importSuccess) {
          return NextResponse.json(
            { error: "Failed to import configuration" },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          config: importConfig,
          message: "Configuration imported successfully",
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error("Configuration action failed", {
      errorId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        error: "Failed to process configuration action",
        errorId,
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}