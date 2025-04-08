import unittest
import json
import hashlib
from unittest.mock import patch, MagicMock
from app import app

class BaseTestCase(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        self.client.testing = True

class AuthTestCase(BaseTestCase):
    @patch('app.create_client')
    def test_login_valid_credentials(self, mock_create_client):

        mock_response = MagicMock()
        mock_response.data = [{
            "Email": hashlib.sha256("test@email.com".encode()).hexdigest(),
            "Username": "1234",
            "UserID": 10
        }]
        mock_client = MagicMock()

        mock_client.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = mock_response
        mock_create_client.return_value = mock_client

        response = self.client.post('/login', data={'email': 'test@email.com', 'password': '1234'})
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data.get("success"))
        self.assertIn("user", data)

    @patch('app.create_client')
    def test_login_invalid_credentials(self, mock_create_client):

        mock_response = MagicMock()
        mock_response.data = []
        mock_client = MagicMock()
        mock_client.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = mock_response
        mock_create_client.return_value = mock_client

        response = self.client.post('/login', data={'email': 'wrong@example.com', 'password': 'wrongpassword'})
        self.assertEqual(response.status_code, 401)
        data = json.loads(response.data)
        self.assertFalse(data.get("success"))
        self.assertIn("error", data)

    @patch('app.create_client')
    def test_register_new_user(self, mock_create_client):

        existing_user_response = MagicMock()
        existing_user_response.data = []
        insert_response = MagicMock()
        insert_response.data = [{
            "Email": hashlib.sha256("new@example.com".encode()).hexdigest(),
            "Username": "newuser",
            "UserID": 2
        }]

        mock_client = MagicMock()

        mock_client.table.return_value.select.return_value.eq.return_value.execute.side_effect = [existing_user_response, insert_response]
        mock_create_client.return_value = mock_client

        response = self.client.post('/register', data={
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'newpassword'
        })
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertTrue(data.get("success"))
        self.assertIn("user", data)

    @patch('app.create_client')
    def test_register_existing_user(self, mock_create_client):

        existing_user_response = MagicMock()
        existing_user_response.data = [{
            "Email": hashlib.sha256("existing@example.com".encode()).hexdigest()
        }]
        mock_client = MagicMock()
        mock_client.table.return_value.select.return_value.eq.return_value.execute.return_value = existing_user_response
        mock_create_client.return_value = mock_client

        response = self.client.post('/register', data={
            'username': 'existinguser',
            'email': 'existing@example.com',
            'password': 'password'
        })
        self.assertEqual(response.status_code, 409)
        data = json.loads(response.data)
        self.assertFalse(data.get("success"))
        self.assertIn("error", data)

    def test_logout(self):

        with self.client as client:
            with client.session_transaction() as sess:
                sess["user"] = {"email": "test", "username": "testuser"}
            response = client.post('/logout')
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.data)
            self.assertTrue(data.get("success"))
            with client.session_transaction() as sess:
                self.assertNotIn("user", sess)

class LearningSetTestCase(BaseTestCase):
    @patch('app.create_client')
    def test_create_set_with_session(self, mock_create_client):

        user_id_response = MagicMock()
        user_id_response.data = [{"UserID": 1}]

        insert_set_response = MagicMock()
        insert_set_response.data = [{"LearningSetID": 101, "Name": "Test Set"}]

        mock_client = MagicMock()

        mock_client.table.return_value.select.return_value.eq.return_value.execute.side_effect = [user_id_response]
        mock_client.table.return_value.insert.return_value.execute.return_value = insert_set_response
        mock_create_client.return_value = mock_client


        with self.client as client:
            with client.session_transaction() as sess:
                sess["user"] = {"email": hashlib.sha256("test@example.com".encode()).hexdigest(), "username": "testuser"}
            response = client.post('/sets', json={"Name": "Test Set", "Description": "Test Beschreibung"})
            self.assertEqual(response.status_code, 201)
            data = json.loads(response.data)
            self.assertTrue(data.get("success"))
            self.assertIn("Set", data)

if __name__ == '__main__':
    unittest.main()