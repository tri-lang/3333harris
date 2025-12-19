
export enum ImageFormat {
  JPEG = 'image/jpeg',
  PNG = 'image/png',
  WEBP = 'image/webp',
}

export interface ProcessingOptions {
  quality: number; 
  scale: number; 
  format: ImageFormat;
  maxWidth: number;
}

export interface AnalysisResult {
  description: string;
  tags: string[];
  mainColors: string[];
}

export interface UploadedImage {
  file: File;
  previewUrl: string;
  originalWidth: number;
  originalHeight: number;
  originalSize: number;
}

// --- User Roles ---
export type UserRole = 'super_admin' | 'admin' | 'user';

export interface UserProfile {
  phone: string;
  nickname?: string;
  avatarUrl?: string;
  department?: string;
  role: UserRole;
  password?: string; 
}

export interface ComfyWorkflow {
  id: string;
  name: string;
  description: string;
  apiJson: any; 
  createdAt: number;
}

export interface ModelPreset {
  id: string;
  name: string;
  value: string;
}

export interface CarouselSlide {
  id: string;
  title: string;
  desc: string;
  buttonText: string;
  buttonIcon: string;
  linkTarget: string;
  gradient: string;
  bgImage?: string; // New field for background image
}

export interface FeatureItem {
  id: string;
  title: string;
  desc: string;
  color: string;
  linkTarget?: string;
}

export interface HomePageSettings {
  mainTitle: string;
  subTitle: string;
  slides: CarouselSlide[];
  features: FeatureItem[];
}

export interface SiteSettings {
  title: string;
  englishTitle: string;
  logoUrl?: string;
  announcement?: string; 
  adminQrCodeUrl?: string; 
  departments: string[];
  homePage?: HomePageSettings;
}

export type ModuleType = 'prompt' | 'negativePrompt' | 'imageUpload' | 'model' | 'aspectRatio' | 'batchSize' | 'textOutput';

export interface LayoutModule {
  id: ModuleType;
  isEnabled: boolean;
  label: string;
}

export interface PageLayoutConfig {
  modules: LayoutModule[];
}

export interface MappingConfig {
  nodeId: string;
  field: string;
  // Specialized for aspect ratio
  widthNodeId?: string;
  widthField?: string;
  heightNodeId?: string;
  heightField?: string;
}

export interface MenuConfig {
  id: string; 
  label: string; 
  icon: string; 
  pageTitle?: string;
  pageDesc?: string;
  workflowId: string | null;
  isEnabled: boolean;
  layout: PageLayoutConfig;
  inputMappings: {
    [key in ModuleType]?: MappingConfig;
  };
  modelPresets?: ModelPreset[]; 
  outputNodeId: string | null; 
}

export interface ComfyServer {
  id: string;
  name: string;
  url: string;
  allowedDepartments: string[];
  isEnabled: boolean;
}

export interface HistoryItem {
  id: string;
  imageUrl?: string;
  textOutput?: string;
  prompt: string;
  timestamp: number;
  width: number;
  height: number;
  menuId: string;
}

export interface Comment {
  id: string;
  userPhone: string;
  userNickname?: string;
  userAvatar?: string;
  userDepartment?: string;
  content: string;
  timestamp: number;
  likes: number;
  replies: Comment[];
}
