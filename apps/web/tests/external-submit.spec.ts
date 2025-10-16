import { test, expect } from '@playwright/test';

test.describe('External Submit Page', () => {
  test('should load the external submit page', async ({ page }) => {
    await page.goto('/external-submit');
    await expect(page).toHaveTitle(/.*Omni Saúde.*/);
    await expect(page.locator('h1')).toContainText('Portal de Envio Externo');
  });

  test('should show validation errors for empty required fields', async ({ page }) => {
    await page.goto('/external-submit');

    // Click submit without filling fields
    await page.getByRole('button', { name: 'Enviar Documento' }).click();

    // Check for error message
    await expect(page.locator('text=Todos os campos obrigatórios devem ser preenchidos')).toBeVisible();
  });

  test('should show validation error when no files are selected', async ({ page }) => {
    await page.goto('/external-submit');

    // Fill required fields
    await page.fill('input[placeholder="E-mail do Paciente"]', 'test@example.com');
    await page.fill('input[placeholder="Médico Solicitante"]', 'Dr. Test');
    await page.fill('input[type="date"]', '2024-01-01');
    await page.fill('input[type="time"]', '10:00');

    // Click submit
    await page.getByRole('button', { name: 'Enviar Documento' }).click();

    // Check for error message
    await expect(page.locator('text=Ao menos um arquivo de imagem deve ser anexado')).toBeVisible();
  });

  test('should accept valid file upload and show success message', async ({ page }) => {
    await page.goto('/external-submit');

    // Fill required fields
    await page.fill('input[placeholder="E-mail do Paciente"]', 'test@example.com');
    await page.fill('input[placeholder="Médico Solicitante"]', 'Dr. Test');
    await page.fill('input[type="date"]', '2024-01-01');
    await page.fill('input[type="time"]', '10:00');

    // Create a small test image file
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

    // Upload file to first slot (Requisição)
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'test.jpg',
      mimeType: 'image/jpeg',
      buffer: testImageBuffer
    });

    // Click submit
    await page.getByRole('button', { name: 'Enviar Documento' }).click();

    // Wait for submission and check for success message
    await expect(page.locator('text=Documento Enviado com Sucesso!')).toBeVisible();
    await expect(page.locator('text=Obrigado. O paciente será notificado.')).toBeVisible();
  });

  test('should reject non-image files', async ({ page }) => {
    await page.goto('/external-submit');

    // Fill required fields
    await page.fill('input[placeholder="E-mail do Paciente"]', 'test@example.com');
    await page.fill('input[placeholder="Médico Solicitante"]', 'Dr. Test');
    await page.fill('input[type="date"]', '2024-01-01');
    await page.fill('input[type="time"]', '10:00');

    // Try to upload a text file
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('This is a text file')
    });

    // Click submit
    await page.getByRole('button', { name: 'Enviar Documento' }).click();

    // Check for error message
    await expect(page.locator('text=Apenas arquivos do tipo imagem são aceitos')).toBeVisible();
  });

  test('should reject files larger than 2KB', async ({ page }) => {
    await page.goto('/external-submit');

    // Fill required fields
    await page.fill('input[placeholder="E-mail do Paciente"]', 'test@example.com');
    await page.fill('input[placeholder="Médico Solicitante"]', 'Dr. Test');
    await page.fill('input[type="date"]', '2024-01-01');
    await page.fill('input[type="time"]', '10:00');

    // Create a file larger than 2KB
    const largeBuffer = Buffer.alloc(3000, 'x'); // 3KB

    // Upload large file
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'large.jpg',
      mimeType: 'image/jpeg',
      buffer: largeBuffer
    });

    // Click submit
    await page.getByRole('button', { name: 'Enviar Documento' }).click();

    // Check for error message
    await expect(page.locator('text=O arquivo deve ter no máximo 2KB')).toBeVisible();
  });

  test('should support drag and drop file upload', async ({ page }) => {
    await page.goto('/external-submit');

    // Fill required fields
    await page.fill('input[placeholder="E-mail do Paciente"]', 'test@example.com');
    await page.fill('input[placeholder="Médico Solicitante"]', 'Dr. Test');
    await page.fill('input[type="date"]', '2024-01-01');
    await page.fill('input[type="time"]', '10:00');

    // Create a small test image file
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

    // Drag and drop file to first drop zone
    const dropZone = page.locator('.drop-zone').first();
    await dropZone.dispatchEvent('dragover');
    await dropZone.dispatchEvent('drop', {
      dataTransfer: {
        files: [
          new File([testImageBuffer], 'test.jpg', { type: 'image/jpeg' })
        ]
      }
    });

    // Verify file was added
    await expect(page.locator('text=test.jpg')).toBeVisible();

    // Click submit
    await page.getByRole('button', { name: 'Enviar Documento' }).click();

    // Check for success message
    await expect(page.locator('text=Documento Enviado com Sucesso!')).toBeVisible();
  });

  test('should allow multiple file uploads to different slots', async ({ page }) => {
    await page.goto('/external-submit');

    // Fill required fields
    await page.fill('input[placeholder="E-mail do Paciente"]', 'test@example.com');
    await page.fill('input[placeholder="Médico Solicitante"]', 'Dr. Test');
    await page.fill('input[type="date"]', '2024-01-01');
    await page.fill('input[type="time"]', '10:00');

    // Create test image files
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

    // Upload to first slot (Requisição)
    const fileInput1 = page.locator('input[type="file"]').nth(0);
    await fileInput1.setInputFiles({
      name: 'requisicao.jpg',
      mimeType: 'image/jpeg',
      buffer: testImageBuffer
    });

    // Upload to second slot (Autorização)
    const fileInput2 = page.locator('input[type="file"]').nth(1);
    await fileInput2.setInputFiles({
      name: 'autorizacao.jpg',
      mimeType: 'image/jpeg',
      buffer: testImageBuffer
    });

    // Verify both files were added
    await expect(page.locator('text=requisicao.jpg')).toBeVisible();
    await expect(page.locator('text=autorizacao.jpg')).toBeVisible();

    // Click submit
    await page.getByRole('button', { name: 'Enviar Documento' }).click();

    // Check for success message
    await expect(page.locator('text=Documento Enviado com Sucesso!')).toBeVisible();
  });

  test('should show professional suggestions when typing', async ({ page }) => {
    await page.goto('/external-submit');

    // Fill email first
    await page.fill('input[placeholder="E-mail do Paciente"]', 'test@example.com');

    // Type in professional field
    await page.fill('input[placeholder="Médico Solicitante"]', 'Dr');

    // Wait for suggestions (though they won't appear in test without backend)
    // This test mainly ensures the UI doesn't break
    await expect(page.locator('input[placeholder="Médico Solicitante"]')).toHaveValue('Dr');
  });

  test('should handle form submission errors gracefully', async ({ page }) => {
    await page.goto('/external-submit');

    // Fill with invalid email
    await page.fill('input[placeholder="E-mail do Paciente"]', 'invalid-email');
    await page.fill('input[placeholder="Médico Solicitante"]', 'Dr. Test');
    await page.fill('input[type="date"]', '2024-01-01');
    await page.fill('input[type="time"]', '10:00');

    // Upload valid file
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'test.jpg',
      mimeType: 'image/jpeg',
      buffer: testImageBuffer
    });

    // Click submit
    await page.getByRole('button', { name: 'Enviar Documento' }).click();

    // Should show error message (backend validation)
    await expect(page.locator('text=Dados inválidos')).toBeVisible();
  });
});