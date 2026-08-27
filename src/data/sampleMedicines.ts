import { MedicineAnalysisResult } from '../types';

export interface SampleMedicine {
  id: string;
  name: string;
  category: string;
  typeBadge: string;
  color: string;
  result: MedicineAnalysisResult;
}

export const SAMPLE_MEDICINES: SampleMedicine[] = [
  {
    id: 'amlodipine',
    name: 'Thuốc Amlodipine 5mg',
    category: 'Thuốc Trị Huyết Áp',
    typeBadge: '💊 Thuốc',
    color: 'from-blue-600 to-indigo-700',
    result: {
      status: 'success',
      item_type: 'medicine',
      item_name: 'Thuốc Amlodipine 5mg (Huyết áp)',
      item_category: 'MEDICINE',
      product_name: 'Thuốc Amlodipine 5mg (Huyết áp)',
      usage_summary: 'Thuốc hạ và ổn định huyết áp cho người cao tuổi',
      primary_purpose: 'Thuốc hạ và ổn định huyết áp cho người cao tuổi',
      primary_function: 'Thuốc hạ và ổn định huyết áp cho người cao tuổi',
      expiration_info: {
        status: 'VALID',
        expiry_date_text: 'HSD: 15/10/2027',
        mfg_date_text: 'NSX: 15/10/2024',
        days_remaining_text: 'Còn hơn 1 năm nữa (Rất an toàn)',
        location_found: 'Dập nổi ở đuôi vỉ thuốc và in góc phải hộp',
      },
      usage_instructions: 'Mỗi ngày uống 1 lần, mỗi lần 1 viên sau khi ăn sáng no.',
      usage_instruction: 'Mỗi ngày uống 1 lần, mỗi lần 1 viên sau khi ăn sáng no.',
      how_to_use: 'Mỗi ngày uống 1 lần, mỗi lần 1 viên sau khi ăn sáng no.',
      safety_alert: 'Không uống khi bụng đói, tránh ăn bưởi chùm và uống vào một giờ cố định mỗi ngày.',
      speech_script: 'Dạ thưa Bác! Đây là thuốc Amlodipine 5mg, dùng để điều trị và ổn định huyết áp. Về hạn sử dụng: Thuốc còn hạn dùng đến tháng 10 năm 2027, còn hơn 1 năm nữa nên rất an toàn. Mỗi ngày Bác uống một viên vào buổi sáng sau khi ăn no ạ.'
    }
  },
  {
    id: 'sunsilk-shampoo',
    name: 'Dầu gội Sunsilk Óng Mượt',
    category: 'Chăm Sóc Cá Nhân',
    typeBadge: '🧴 Đồ Dùng',
    color: 'from-pink-600 to-rose-700',
    result: {
      status: 'success',
      item_type: 'food_or_consumer',
      item_name: 'Dầu gội đầu Sunsilk Mềm Mượt Diệu Kỳ',
      item_category: 'HOUSEHOLD_GOOD',
      product_name: 'Dầu gội đầu Sunsilk Mềm Mượt Diệu Kỳ',
      usage_summary: 'Dùng để gội đầu làm sạch tóc và da đầu',
      primary_purpose: 'Dùng để gội đầu làm sạch tóc và da đầu',
      primary_function: 'Dùng để gội đầu làm sạch tóc và da đầu',
      expiration_info: {
        status: 'VALID',
        expiry_date_text: 'HSD: 18/08/2026',
        mfg_date_text: 'NSX: 18/08/2023',
        days_remaining_text: 'Còn hạn sử dụng',
        location_found: 'In ở mặt sau gần mã vạch',
      },
      usage_instructions: 'Làm ướt tóc, lấy một lượng vừa đủ xoa đều tạo bọt rồi xả sạch với nước.',
      usage_instruction: 'Làm ướt tóc, lấy một lượng vừa đủ xoa đều tạo bọt rồi xả sạch với nước.',
      how_to_use: 'Làm ướt tóc, lấy một lượng vừa đủ xoa đều tạo bọt rồi xả sạch với nước.',
      safety_alert: 'CẢNH BÁO: Chỉ dùng ngoài da, tuyệt đối không được uống và tránh để bọt dính vào mắt.',
      speech_script: 'Dạ thưa Bác! Đây là chai dầu gội đầu Sunsilk để gội đầu, không phải thuốc uống. Về hạn sử dụng: Chai còn hạn dùng đến tháng 8 năm 2026. Bác thoa lên tóc ướt rồi xả sạch với nước. Bác nhớ cẩn thận đừng để xà phòng dính vào mắt ạ.'
    }
  },
  {
    id: 'expired-milk',
    name: 'Sữa Tươi Tiệt Trùng (Đã Hết Hạn)',
    category: 'Thực Phẩm & Đồ Uống',
    typeBadge: '🥛 Thực Phẩm',
    color: 'from-red-600 to-amber-700',
    result: {
      status: 'success',
      item_type: 'food_or_consumer',
      item_name: 'Hộp Sữa Tươi Tiệt Trùng TH True Milk',
      item_category: 'HOUSEHOLD_GOOD',
      product_name: 'Hộp Sữa Tươi Tiệt Trùng TH True Milk',
      usage_summary: 'Thực phẩm dinh dưỡng bổ sung canxi và năng lượng',
      primary_purpose: 'Thực phẩm dinh dưỡng bổ sung canxi và năng lượng',
      primary_function: 'Thực phẩm dinh dưỡng bổ sung canxi và năng lượng',
      expiration_info: {
        status: 'EXPIRED',
        expiry_date_text: 'HSD: 05/01/2024 (ĐÃ HẾT HẠN)',
        mfg_date_text: 'NSX: 05/07/2023',
        days_remaining_text: 'ĐÃ QUÁ HẠN HƠN 2 NĂM',
        location_found: 'In phun trên nắp hộp sữa',
      },
      usage_instructions: 'Sản phẩm đã quá hạn sử dụng, tuyệt đối không được uống.',
      usage_instruction: 'Sản phẩm đã quá hạn sử dụng, tuyệt đối không được uống.',
      how_to_use: 'Sản phẩm đã quá hạn sử dụng, tuyệt đối không được uống.',
      safety_alert: 'CẢNH BÁO NGUY HIỂM: Hộp sữa này ĐÃ HẾT HẠN! Bác không được uống để tránh bị đau bụng ngộ độc.',
      speech_script: 'Dạ Bác ơi, cháu xin cảnh báo: Hộp sữa tươi này ĐÃ HẾT HẠN SỬ DỤNG từ ngày 5 tháng 1 năm 2024 rồi ạ! Bác tuyệt đối không được uống hộp này nữa để tránh bị đau bụng ngộ độc ạ.'
    }
  },
  {
    id: 'panadol-extra',
    name: 'Panadol Extra Đỏ',
    category: 'Giảm Đau & Hạ Sốt',
    typeBadge: '💊 Thuốc',
    color: 'from-red-600 to-rose-700',
    result: {
      status: 'success',
      item_type: 'medicine',
      item_name: 'Thuốc Panadol Extra (Paracetamol + Caffeine)',
      item_category: 'MEDICINE',
      product_name: 'Thuốc Panadol Extra (Paracetamol + Caffeine)',
      usage_summary: 'Thuốc giảm đau nhức đầu, đau xương khớp và hạ sốt',
      primary_purpose: 'Thuốc giảm đau nhức đầu, đau xương khớp và hạ sốt',
      primary_function: 'Thuốc giảm đau nhức đầu, đau xương khớp và hạ sốt',
      expiration_info: {
        status: 'VALID',
        expiry_date_text: 'HSD: 12/2026',
        mfg_date_text: 'NSX: 12/2023',
        days_remaining_text: 'Còn khoảng 4 tháng nữa',
        location_found: 'Dập nhiệt trên mép vỉ thuốc',
      },
      usage_instructions: 'Uống 1 viên sau khi ăn no, mỗi lần uống cách nhau ít nhất 4 đến 6 tiếng.',
      usage_instruction: 'Uống 1 viên sau khi ăn no, mỗi lần uống cách nhau ít nhất 4 đến 6 tiếng.',
      how_to_use: 'Uống 1 viên sau khi ăn no, mỗi lần uống cách nhau ít nhất 4 đến 6 tiếng.',
      safety_alert: 'Không uống quá 4 viên trong 24 giờ. Tránh uống vào buổi tối muộn vì có chất gây khó ngủ.',
      speech_script: 'Dạ thưa Bác! Đây là thuốc Panadol Extra đỏ giúp Bác giảm đau nhức và hạ sốt. Về hạn sử dụng: Thuốc còn hạn đến tháng 12 năm 2026. Khi đau nhức, Bác uống một viên sau khi ăn no. Bác không uống quá 4 viên một ngày và tránh uống buổi tối muộn ạ.'
    }
  },
  {
    id: 'fish-sauce',
    name: 'Nước Mắm Nam Ngư',
    category: 'Gia Vị Nhà Bếp',
    typeBadge: '🧂 Gia Vị',
    color: 'from-amber-600 to-orange-700',
    result: {
      status: 'success',
      item_type: 'food_or_consumer',
      item_name: 'Nước Mắm Đệ Nhị Nam Ngư',
      item_category: 'HOUSEHOLD_GOOD',
      product_name: 'Nước Mắm Đệ Nhị Nam Ngư',
      usage_summary: 'Gia vị chấm hoặc nêm nếm khi nấu ăn',
      primary_purpose: 'Gia vị chấm hoặc nêm nếm khi nấu ăn',
      primary_function: 'Gia vị chấm hoặc nêm nếm khi nấu ăn',
      expiration_info: {
        status: 'VALID',
        expiry_date_text: 'HSD: 12 tháng kể từ ngày mở nắp',
        mfg_date_text: 'NSX: 10/2025',
        days_remaining_text: 'Còn hạn dùng tốt',
        location_found: 'In laser trên cổ chai',
      },
      usage_instructions: 'Dùng trực tiếp làm nước chấm hoặc nêm một lượng vừa phải vào món ăn.',
      usage_instruction: 'Dùng trực tiếp làm nước chấm hoặc nêm một lượng vừa phải vào món ăn.',
      how_to_use: 'Dùng trực tiếp làm nước chấm hoặc nêm một lượng vừa phải vào món ăn.',
      safety_alert: 'Người cao tuổi có bệnh huyết áp hoặc thận nên hạn chế ăn quá mặn.',
      speech_script: 'Dạ thưa Bác! Đây là chai nước mắm Nam Ngư dùng để nêm nếm thức ăn hoặc làm nước chấm trong bếp. Về hạn sử dụng: Chai còn hạn dùng 12 tháng kể từ khi mở nắp. Vì Bác lớn tuổi nên mình nêm vừa phải, tránh ăn quá mặn sẽ ảnh hưởng đến huyết áp ạ.'
    }
  },
  {
    id: 'faded-herb',
    name: 'Dầu Gió Xanh (Nhãn Mờ HSD)',
    category: 'Dầu Xoa Bóp Ngoài Da',
    typeBadge: '🧴 Đồ Dùng',
    color: 'from-emerald-600 to-teal-700',
    result: {
      status: 'success',
      item_type: 'food_or_consumer',
      item_name: 'Chai Dầu Gió Xanh Con Ó',
      item_category: 'HOUSEHOLD_GOOD',
      product_name: 'Chai Dầu Gió Xanh Con Ó',
      usage_summary: 'Dầu xoa bóp ngoài da giảm đau bụng, cảm gió, nhức mỏi',
      primary_purpose: 'Dầu xoa bóp ngoài da giảm đau bụng, cảm gió, nhức mỏi',
      primary_function: 'Dầu xoa bóp ngoài da giảm đau bụng, cảm gió, nhức mỏi',
      expiration_info: {
        status: 'UNCLEAR',
        expiry_date_text: 'Không thấy rõ HSD',
        days_remaining_text: 'Cần người nhà xem giúp',
        location_found: 'Chữ dập dưới đáy chai bị trầy xước',
      },
      usage_instructions: 'Thoa một lượng nhỏ lên vùng da bị đau nhức, thái dương hoặc ngực.',
      usage_instruction: 'Thoa một lượng nhỏ lên vùng da bị đau nhức, thái dương hoặc ngực.',
      how_to_use: 'Thoa một lượng nhỏ lên vùng da bị đau nhức, thái dương hoặc ngực.',
      safety_alert: 'CẢNH BÁO: Không bôi lên vết thương hở, không được uống và tránh xa tầm mắt.',
      speech_script: 'Dạ thưa Bác! Đây là chai dầu gió xanh Con Ó dùng để xoa bóp ngoài da khi cảm mạo hoặc nhức mỏi. Về hạn sử dụng: Chữ in dưới đáy chai hiện không thấy rõ, Bác nên nhờ người nhà kiểm tra lại trước khi dùng và tuyệt đối không được uống ạ.'
    }
  }
];

