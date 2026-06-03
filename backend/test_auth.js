import axios from 'axios';

async function test() {
  const email = `test_${Date.now()}@example.com`;
  const password = 'Password123';
  const name = 'Test User';

  console.log('Testing Authentication APIs...');
  
  try {
    // 1. Register User
    console.log(`\n1. Registering user with email: ${email}`);
    const regRes = await axios.post('http://localhost:5000/api/auth/register', {
      name,
      email,
      password
    });
    console.log('Register Success:', regRes.data);

    // 2. Login User
    console.log('\n2. Logging in...');
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email,
      password
    });
    console.log('Login Success:', loginRes.data);
    const token = loginRes.data.token;

    // 3. Fetch Profile (GET /me)
    console.log('\n3. Fetching profile details (GET /me) with token...');
    const meRes = await axios.get('http://localhost:5000/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Get Me Success:', meRes.data);
    
    console.log('\nAll auth tests passed successfully!');
  } catch (error) {
    console.error('\nTest failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

test();
