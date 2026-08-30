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
      item_type: 'MEDICINE',
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
    id: 'wallet-item',
    name: 'Ví Tiền Da Bỏ Túi',
    category: 'Đồ Dùng Cá Nhân',
    typeBadge: '👛 Đồ Cá Nhân',
    color: 'from-amber-700 to-yellow-800',
    result: {
      status: 'success',
      item_type: 'PERSONAL_ITEM',
      item_name: 'Ví Tiền Da Bỏ Túi',
      item_category: 'PERSONAL_ITEM',
      product_name: 'Ví Tiền Da Bỏ Túi',
      usage_summary: 'Đồ dùng cá nhân để cất giữ tiền mặt và giấy tờ tùy thân',
      primary_purpose: 'Đồ dùng cá nhân để cất giữ tiền mặt và giấy tờ tùy thân',
      primary_function: 'Đồ dùng cá nhân để cất giữ tiền mặt và giấy tờ tùy thân',
      expiration_info: {
        status: 'NOT_APPLICABLE',
        expiry_date_text: 'Không áp dụng hạn dùng',
        days_remaining_text: 'Đồ dùng cá nhân',
      },
      usage_instructions: 'Bác nhớ cất ví vào túi áo hoặc kệ quen thuộc kẻo quên ạ!',
      usage_instruction: 'Bác nhớ cất ví vào túi áo hoặc kệ quen thuộc kẻo quên ạ!',
      how_to_use: 'Bác nhớ cất ví vào túi áo hoặc kệ quen thuộc kẻo quên ạ!',
      safety_alert: '',
      speech_script: 'Dạ thưa Bác! Đây là chiếc ví tiền da của Bác để đựng tiền và giấy tờ. Bác nhớ cất ví cẩn thận vào túi áo hoặc ngăn tủ quen thuộc kẻo quên ạ.'
    }
  },
  {
    id: 'key-item',
    name: 'Chùm Chìa Khóa Nhà',
    category: 'Đồ Dùng Cá Nhân',
    typeBadge: '🔑 Chìa Khóa',
    color: 'from-slate-700 to-zinc-900',
    result: {
      status: 'success',
      item_type: 'PERSONAL_ITEM',
      item_name: 'Chùm Chìa Khóa Cửa Nhà',
      item_category: 'PERSONAL_ITEM',
      product_name: 'Chùm Chìa Khóa Cửa Nhà',
      usage_summary: 'Chìa khóa mở cửa nhà và các phòng',
      primary_purpose: 'Chìa khóa mở cửa nhà và các phòng',
      primary_function: 'Chìa khóa mở cửa nhà và các phòng',
      expiration_info: {
        status: 'NOT_APPLICABLE',
        expiry_date_text: 'Không áp dụng hạn dùng',
        days_remaining_text: 'Đồ dùng cá nhân',
      },
      usage_instructions: 'Chìa khóa của Bác, Bác nhớ móc vào chỗ quen để khi cần dễ tìm ạ!',
      usage_instruction: 'Chìa khóa của Bác, Bác nhớ móc vào chỗ quen để khi cần dễ tìm ạ!',
      how_to_use: 'Chìa khóa của Bác, Bác nhớ móc vào chỗ quen để khi cần dễ tìm ạ!',
      safety_alert: '',
      speech_script: 'Dạ thưa Bác! Đây là chùm chìa khóa nhà của Bác. Bác nhớ treo chìa khóa vào móc cố định gần cửa ra vào để khi cần dễ tìm ạ.'
    }
  },
  {
    id: 'remote-appliance',
    name: 'Điều Khiển Điều Hòa (Gia Dụng)',
    category: 'Đồ Gia Dụng',
    typeBadge: '🏠 Gia Dụng',
    color: 'from-teal-700 to-emerald-900',
    result: {
      status: 'success',
      item_type: 'PERSONAL_ITEM',
      item_name: 'Điều Khiển Điều Hòa / Máy Lạnh',
      item_category: 'PERSONAL_ITEM',
      product_name: 'Điều Khiển Điều Hòa / Máy Lạnh',
      usage_summary: 'Thiết bị gia dụng dùng để bật tắt và điều chỉnh nhiệt độ điều hòa trong phòng',
      primary_purpose: 'Thiết bị gia dụng dùng để bật tắt và điều chỉnh nhiệt độ điều hòa trong phòng',
      primary_function: 'Thiết bị gia dụng dùng để bật tắt và điều chỉnh nhiệt độ điều hòa trong phòng',
      expiration_info: {
        status: 'NOT_APPLICABLE',
        expiry_date_text: 'Không áp dụng hạn dùng',
        days_remaining_text: 'Đồ gia dụng trong nhà',
      },
      usage_instructions: 'Bác bấm nút ON/OFF màu đỏ để bật tắt, nút mũi tên lên xuống để tăng giảm nhiệt độ ạ!',
      usage_instruction: 'Bác bấm nút ON/OFF màu đỏ để bật tắt, nút mũi tên lên xuống để tăng giảm nhiệt độ ạ!',
      how_to_use: 'Bác bấm nút ON/OFF màu đỏ để bật tắt, nút mũi tên lên xuống để tăng giảm nhiệt độ ạ!',
      safety_alert: '',
      speech_script: 'Dạ thưa Bác! Đây là chiếc điều khiển điều hòa trong phòng. Bác bấm nút màu đỏ để bật tắt máy và bấm nút mũi tên để điều chỉnh nhiệt độ mát mẻ ạ.'
    }
  },
  {
    id: 'eugica-box-front',
    name: 'Hộp Thuốc Eugica (Mặt Trước)',
    category: 'Mặt Trước Hộp - Thiếu HSD',
    typeBadge: '🔄 Cần Lật Mặt',
    color: 'from-blue-600 to-cyan-700',
    result: {
      status: 'need_second_side',
      item_type: 'MEDICINE',
      item_name: 'Thuốc Ho Viên Nang Eugica',
      item_category: 'MEDICINE',
      product_name: 'Thuốc Ho Viên Nang Eugica',
      usage_summary: 'Thuốc thảo dược hỗ trợ giảm ho, long đờm và đau rát họng',
      primary_purpose: 'Thuốc thảo dược hỗ trợ giảm ho, long đờm và đau rát họng',
      primary_function: 'Thuốc thảo dược hỗ trợ giảm ho, long đờm và đau rát họng',
      expiration_info: {
        status: 'UNCLEAR',
        expiry_date_text: 'Cần lật mặt sau / mặt đáy',
        days_remaining_text: 'Chưa thấy ngày HSD',
      },
      usage_instructions: 'Bác lật mặt sau hoặc mặt đáy của hộp rồi bấm chụp lại để xem hạn sử dụng ạ.',
      usage_instruction: 'Bác lật mặt sau hoặc mặt đáy của hộp rồi bấm chụp lại để xem hạn sử dụng ạ.',
      how_to_use: 'Bác lật mặt sau hoặc mặt đáy của hộp rồi bấm chụp lại để xem hạn sử dụng ạ.',
      safety_alert: '',
      speech_script: 'Cháu thấy Thuốc Ho Viên Nang Eugica rồi ạ! Nhưng mặt này chưa thấy hạn sử dụng. Bác lật mặt sau hoặc mặt đáy của hộp rồi bấm chụp lại giúp cháu ạ!'
    }
  },
  {
    id: 'chocopie-individual-pack',
    name: 'Gói Bánh Choco-pie Bóc Lẻ',
    category: 'Gói Bóc Lẻ Hộp Lớn',
    typeBadge: '🍪 Bánh Lẻ',
    color: 'from-amber-600 to-red-700',
    result: {
      status: 'individual_pack',
      item_type: 'CONSUMER_GOODS',
      item_name: 'Bánh Choco-pie Orion',
      item_category: 'CONSUMER_GOODS',
      product_name: 'Bánh Choco-pie Orion',
      usage_summary: 'Bánh sô-cô-la kem dẻo marsh-mallow ăn nhẹ dinh dưỡng',
      primary_purpose: 'Bánh sô-cô-la kem dẻo marsh-mallow ăn nhẹ dinh dưỡng',
      primary_function: 'Bánh sô-cô-la kem dẻo marsh-mallow ăn nhẹ dinh dưỡng',
      expiration_info: {
        status: 'UNCLEAR',
        expiry_date_text: 'Gói bóc lẻ - Không ghi HSD',
        days_remaining_text: 'Cần xem vỏ hộp lớn',
      },
      usage_instructions: 'Nếu vỏ hộp lớn mua đã lâu hoặc bánh có dấu hiệu bị hỏng, Bác không nên ăn để đảm bảo sức khỏe ạ.',
      usage_instruction: 'Nếu vỏ hộp lớn mua đã lâu hoặc bánh có dấu hiệu bị hỏng, Bác không nên ăn để đảm bảo sức khỏe ạ.',
      how_to_use: 'Nếu vỏ hộp lớn mua đã lâu hoặc bánh có dấu hiệu bị hỏng, Bác không nên ăn để đảm bảo sức khỏe ạ.',
      safety_alert: 'LƯU Ý: Đây là gói lẻ không ghi hạn sử dụng trên vỏ.',
      speech_script: 'Dạ đây là gói lẻ nên không ghi hạn sử dụng trên vỏ ạ. Nếu vỏ hộp lớn mua đã lâu hoặc bánh có dấu hiệu bị hỏng, Bác không nên ăn để đảm bảo sức khỏe ạ.'
    }
  },
  {
    id: 'medicine-individual-strip',
    name: 'Vỉ Thuốc Xé Lẻ (Không HSD)',
    category: 'Vỉ Thuốc Xé Lẻ',
    typeBadge: '💊 Vỉ Thuốc Lẻ',
    color: 'from-red-600 to-rose-800',
    result: {
      status: 'individual_pack',
      item_type: 'MEDICINE',
      item_name: 'Vỉ Thuốc Panadol Xé Lẻ',
      item_category: 'MEDICINE',
      product_name: 'Vỉ Thuốc Panadol Xé Lẻ',
      usage_summary: 'Thuốc giảm đau hạ sốt cắt lẻ không có thông tin hạn dùng',
      primary_purpose: 'Thuốc giảm đau hạ sốt cắt lẻ không có thông tin hạn dùng',
      primary_function: 'Thuốc giảm đau hạ sốt cắt lẻ không có thông tin hạn dùng',
      expiration_info: {
        status: 'UNCLEAR',
        expiry_date_text: 'Vỉ thuốc xé lẻ - Không có HSD',
        days_remaining_text: 'Cảnh báo an toàn thuốc',
      },
      usage_instructions: 'Nếu Bác không nhớ rõ ngày mua, Bác tuyệt đối không nên uống liều thuốc này để đảm bảo an toàn ạ.',
      usage_instruction: 'Nếu Bác không nhớ rõ ngày mua, Bác tuyệt đối không nên uống liều thuốc này để đảm bảo an toàn ạ.',
      how_to_use: 'Nếu Bác không nhớ rõ ngày mua, Bác tuyệt đối không nên uống liều thuốc này để đảm bảo an toàn ạ.',
      safety_alert: 'CẢNH BÁO ĐỎ: Vỉ thuốc xé lẻ không có thông tin hạn sử dụng. Tuyệt đối không nên uống nếu không nhớ ngày mua!',
      speech_script: 'Bác ơi, đây là vỉ thuốc xé lẻ không có thông tin hạn sử dụng. Để đảm bảo an toàn tuyệt đối cho sức khỏe, nếu Bác không nhớ rõ ngày mua, Bác tuyệt đối KHÔNG NÊN UỐNG liều thuốc này ạ!'
    }
  },
  {
    id: 'cross-mismatch-sample',
    name: 'Chụp Nhầm Sang Hộp Khác (Mặt 2)',
    category: 'Cảnh Báo Chụp Nhầm',
    typeBadge: '⚠️ Chụp Nhầm',
    color: 'from-red-700 to-orange-800',
    result: {
      status: 'cross_product_mismatch',
      item_type: 'CONSUMER_GOODS',
      item_name: 'Sản phẩm khác với mặt trước',
      item_category: 'CONSUMER_GOODS',
      product_name: 'Sản phẩm khác với mặt trước',
      is_cross_mismatch: true,
      usage_summary: 'Hình chụp không khớp với sản phẩm mặt trước lúc nãy',
      primary_purpose: 'Hình chụp không khớp với sản phẩm mặt trước lúc nãy',
      primary_function: 'Hình chụp không khớp với sản phẩm mặt trước lúc nãy',
      expiration_info: {
        status: 'UNCLEAR',
        expiry_date_text: 'Chụp nhầm sản phẩm khác',
        days_remaining_text: 'Vui lòng chụp lại đúng hộp',
      },
      usage_instructions: 'Bác vui lòng lấy đúng sản phẩm lúc nãy và chụp lại mặt sau ạ.',
      usage_instruction: 'Bác vui lòng lấy đúng sản phẩm lúc nãy và chụp lại mặt sau ạ.',
      how_to_use: 'Bác vui lòng lấy đúng sản phẩm lúc nãy và chụp lại mặt sau ạ.',
      safety_alert: 'Hình như Bác đang chụp một sản phẩm khác với mặt trước lúc nãy.',
      speech_script: 'Hình như Bác đang chụp một sản phẩm khác rồi ạ. Bác kiểm tra lại đúng hộp bánh lúc nãy để cháu đọc lại ạ!'
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
      item_type: 'CONSUMER_GOODS',
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
      is_expired: true,
      item_type: 'CONSUMER_GOODS',
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

