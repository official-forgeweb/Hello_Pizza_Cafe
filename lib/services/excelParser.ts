import * as xlsx from 'xlsx';

export class ExcelParserService {
  /**
   * Parse a buffer containing Excel or CSV data
   * @param buffer File buffer
   */
  static parseContactsFile(buffer: Buffer) {
    try {
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON array of objects
      const rawData = xlsx.utils.sheet_to_json(worksheet);
      
      return this.processRawData(rawData);
    } catch (error: any) {
      console.error('Error parsing Excel file:', error);
      throw new Error(`Failed to parse file: ${error.message}`);
    }
  }

  /**
   * Clean and normalize phone numbers
   */
  static cleanPhoneNumber(phone: string | number): string {
    if (!phone) return '';
    
    // Convert to string and remove all non-numeric characters
    let cleaned = String(phone).replace(/\D/g, '');
    
    // Handle Indian numbers specific formatting (common case)
    if (cleaned.length === 10) {
      cleaned = '91' + cleaned;
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
      // already good
    } else if (cleaned.startsWith('0')) {
      // Strip leading zero and assume +91
      cleaned = '91' + cleaned.substring(1);
    }
    
    return cleaned;
  }

  /**
   * Process raw JSON data from Excel
   */
  static processRawData(rawData: any[]) {
    const validContacts: Array<{ name: string; phone: string; email?: string; tags?: string[] }> = [];
    const errors: Array<{ row: number; reason: string }> = [];

    rawData.forEach((row, index) => {
      // Common header names variations
      const name = row['Name'] || row['name'] || row['Full Name'] || row['Customer Name'] || row['first name'] || '';
      const rawPhone = row['Phone'] || row['phone'] || row['Mobile'] || row['Phone Number'] || row['WhatsApp'] || '';
      const email = row['Email'] || row['email'] || row['Email Address'] || '';
      const tagsString = row['Tags'] || row['tags'] || row['Group'] || '';

      const rowNum = index + 2; // +1 for 0-index, +1 for header row

      if (!name) {
        errors.push({ row: rowNum, reason: 'Missing name' });
        return;
      }

      if (!rawPhone) {
        errors.push({ row: rowNum, reason: 'Missing phone number' });
        return;
      }

      const phone = this.cleanPhoneNumber(rawPhone);
      
      if (phone.length < 10 || phone.length > 15) {
        errors.push({ row: rowNum, reason: 'Invalid phone number format' });
        return;
      }

      const tags = tagsString 
        ? String(tagsString).split(',').map(t => t.trim()).filter(Boolean)
        : [];

      validContacts.push({
        name: String(name).trim(),
        phone,
        email: email ? String(email).trim() : undefined,
        tags
      });
    });

    return {
      totalRows: rawData.length,
      validCount: validContacts.length,
      errorCount: errors.length,
      validContacts,
      errors
    };
  }
}
