export interface Database {
  public: {
    Tables: {
      skills: {
        Row: {
          id: string;
          url: string;
          name: string;
          raw_content: string;
          frontmatter: Record<string, unknown> | null;
          score: number | null;
          report: string | null;
          scanned_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          url: string;
          name: string;
          raw_content: string;
          frontmatter?: Record<string, unknown> | null;
          score?: number | null;
          report?: string | null;
          scanned_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          url?: string;
          name?: string;
          raw_content?: string;
          frontmatter?: Record<string, unknown> | null;
          score?: number | null;
          report?: string | null;
          scanned_at?: string | null;
          created_at?: string;
        };
      };
      scan_results: {
        Row: {
          id: string;
          skill_id: string;
          check_name: string;
          severity: "critical" | "high" | "medium" | "low" | "info";
          passed: boolean;
          details: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          skill_id: string;
          check_name: string;
          severity: "critical" | "high" | "medium" | "low" | "info";
          passed: boolean;
          details: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          skill_id?: string;
          check_name?: string;
          severity?: "critical" | "high" | "medium" | "low" | "info";
          passed?: boolean;
          details?: string;
          created_at?: string;
        };
      };
    };
  };
}

export type Skill = Database["public"]["Tables"]["skills"]["Row"];
export type ScanResult = Database["public"]["Tables"]["scan_results"]["Row"];
export type Finding = {
  name: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  passed: boolean;
  details: string;
};
