    const API_URL = 'https://api.ytech.tools';

    fetch('../brand.json').then(r => r.json()).then(b => {
      document.getElementById('logo').src = '../' + b.logo || 'branding/logo.svg';
    });

    document.getElementById('trialForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = document.getElementById('submitBtn');
      const errorMsg = document.getElementById('errorMessage');
      const successMsg = document.getElementById('successMessage');

      // Reset messages
      errorMsg.style.display = 'none';
      successMsg.style.display = 'none';

      // Get form data
      const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        company: document.getElementById('company').value,
      };

      // Disable button
      submitBtn.disabled = true;
      submitBtn.textContent = 'Generating License...';

      try {
        const response = await fetch(`${API_URL}/api/trial`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (data.success) {
          // Show success message
          successMsg.style.display = 'block';

          // Create download links
          const licenseBlob = new Blob([data.license_json], { type: 'application/json' });
          const sigBlob = new Blob([data.signature], { type: 'text/plain' });

          const licenseURL = URL.createObjectURL(licenseBlob);
          const sigURL = URL.createObjectURL(sigBlob);

          document.getElementById('downloadLicense').href = licenseURL;
          document.getElementById('downloadSignature').href = sigURL;

          // Scroll to success message
          successMsg.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          // Show error
          errorMsg.textContent = data.message || 'An error occurred. Please try again.';
          errorMsg.style.display = 'block';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Generate Free Trial License';
        }
      } catch (error) {
        console.error('Error:', error);
        errorMsg.textContent = 'Network error. Please check your connection and try again.';
        errorMsg.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Generate Free Trial License';
      }
    });
