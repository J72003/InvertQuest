// Generated type definitions matching the Supabase schema in migrations/001_initial.sql

export type UserRole = 'student' | 'teacher';

export type SizeEstimate = '<1cm' | '1-3cm' | '3-10cm' | '>10cm';
export type ConfidenceLevel = 'certain' | 'likely' | 'unsure';
export type Behavior =
  | 'Crawling'
  | 'Swimming'
  | 'Clinging to rocks'
  | 'Burrowing'
  | 'In a case-shelter'
  | 'Feeding'
  | 'Stationary'
  | 'In a group';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  push_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface Classroom {
  id: string;
  name: string;
  description: string | null;
  join_code: string;
  teacher_id: string;
  created_at: string;
  updated_at: string;
}

export interface ClassroomMember {
  id: string;
  classroom_id: string;
  user_id: string;
  joined_at: string;
}

export interface Taxon {
  id: string;
  common_name: string;
  family: string;
  order_name: string;
  tolerance: number;
  model_class_index: number;
  ecological_notes: string | null;
  created_at: string;
}

export interface Site {
  id: string;
  classroom_id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AIPrediction {
  roboflow: RoboflowPrediction | null;
  claude: ClaudePrediction | null;
}

export interface RoboflowPrediction {
  class_name: string;
  class_index: number;
  confidence: number;
  bbox: { x: number; y: number; width: number; height: number } | null;
}

export interface ClaudePrediction {
  class_name: string;
  class_index: number;
  confidence: number;
  reasoning: string | null;
}

export interface Specimen {
  id: string;
  user_id: string;
  classroom_id: string | null;
  taxon_id: string | null;
  site_id: string | null;
  image_url: string;
  image_path: string;
  size_estimate: SizeEstimate | null;
  habitat: string | null;
  behaviors: Behavior[] | null;
  confidence: ConfidenceLevel | null;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  is_pinned: boolean;
  ai_predictions: AIPrediction | null;
  captured_at: string;
  created_at: string;
  updated_at: string;
}

export interface SpecimenWithRelations extends Specimen {
  taxon: Taxon | null;
  site: Site | null;
  profile: Profile | null;
}

export interface Comment {
  id: string;
  specimen_id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface CommentWithAuthor extends Comment {
  author: Profile;
}

export interface FeedbackView {
  id: string;
  user_id: string;
  specimen_id: string;
  last_viewed_at: string;
}

export interface SiteHealthMetrics {
  site_id: string;
  site_name: string;
  classroom_id: string;
  specimen_count: number;
  taxa_richness: number;
  ept_richness: number;
  fbi_score: number | null;
  fbi_grade: 'A' | 'B' | 'C' | 'D' | null;
}
