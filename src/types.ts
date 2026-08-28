export type ItemCategory = 'MEDICINE' | 'HOUSEHOLD_GOOD' | 'CONSUMER_GOODS' | 'PERSONAL_ITEM';
export type ItemType = 'MEDICINE' | 'CONSUMER_GOODS' | 'PERSONAL_ITEM' | 'UNKNOWN' | 'medicine' | 'food_or_consumer' | 'unknown';
export type ExpiryStatus = 'VALID' | 'EXPIRED' | 'UNCLEAR' | 'NOT_APPLICABLE';

export interface ExpirationInfo {
  status: ExpiryStatus;
  expiry_date_text: string;
  mfg_date_text?: string;
  days_remaining_text?: string;
  location_found?: string;
}

export interface MultiSideSession {
  step: number;
  item_name: string;
  timestamp: number;
  first_side_data?: MedicineAnalysisResult;
  first_side_image?: string;
}

export interface MedicineAnalysisResult {
  // Standardized AI schema fields
  status?: 'success' | 'unclear' | 'not_found' | 'need_second_side' | 'individual_pack' | 'cross_product_mismatch';
  item_type?: ItemType;
  item_name?: string;
  expiry_date?: string;
  is_expired?: boolean;
  usage_summary?: string;
  usage_instructions?: string;
  safety_alert?: string;
  speech_text?: string;
  is_cross_mismatch?: boolean;

  // App UI & backward compatibility fields
  item_category: ItemCategory;
  product_name: string;
  primary_purpose?: string;
  primary_function?: string;
  expiration_info: ExpirationInfo;
  usage_instruction?: string;
  how_to_use?: string;
  speech_script: string;
}

export interface ScannedRecord {
  id: string;
  timestamp: number;
  imagePreview?: string;
  result: MedicineAnalysisResult;
  notes?: string;
}

export type AppTab = 'camera' | 'history' | 'settings';

export interface SeniorSettings {
  autoReadSound: boolean;
  speechRate: number; // 0.85 = Chậm rãi, 1.0 = Vừa phải
  fontSizeScale: number; // 1.0 = Chuẩn, 1.15 = Lớn, 1.3 = Rất lớn
  soundFeedback: boolean;
}

