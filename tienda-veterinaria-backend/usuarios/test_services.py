
import pytest
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from unittest.mock import Mock, patch
from .services import UserService
from .exceptions import (
    UserAlreadyExistsError,
    InvalidPasswordError,
    PasswordMismatchError,
    InvalidCredentialsError,
)

CustomUser = get_user_model()


class TestUserServicePasswordValidation:
   
    def test_validate_password_strength_valid(self):
        UserService.validate_password_strength("MyStr0ng!Pass")

    def test_validate_password_strength_too_short(self):
        with pytest.raises(InvalidPasswordError):
            UserService.validate_password_strength("123")

    def test_validate_password_strength_common(self):
        with pytest.raises(InvalidPasswordError):
            UserService.validate_password_strength("password123")


class TestUserServiceRegistration:

    @patch("usuarios.services.selectors.user_exists")
    @patch("usuarios.services.CustomUser.objects.create_user")
    def test_register_user_success(self, mock_create, mock_exists):
        mock_exists.return_value = False
        mock_user = Mock(spec=CustomUser)
        mock_user.id = 1
        mock_user.username = "testuser"
        mock_create.return_value = mock_user

        user = UserService.register_user(
            username="testuser",
            email="test@example.com",
            password="MyStr0ng!Pass",
            password_confirm="MyStr0ng!Pass",
        )

        assert user.id == 1
        mock_exists.assert_called_once()
        mock_create.assert_called_once()

    def test_register_user_password_mismatch(self):
        with pytest.raises(PasswordMismatchError):
            UserService.register_user(
                username="testuser",
                email="test@example.com",
                password="MyStr0ng!Pass",
                password_confirm="DifferentPass",
            )

    @patch("usuarios.services.selectors.user_exists")
    def test_register_user_already_exists(self, mock_exists):
        mock_exists.return_value = True

        with pytest.raises(UserAlreadyExistsError):
            UserService.register_user(
                username="testuser",
                email="test@example.com",
                password="MyStr0ng!Pass",
                password_confirm="MyStr0ng!Pass",
            )


class TestUserServiceAuthentication:

    @patch("usuarios.services.selectors.get_user_by_email")
    @patch("usuarios.services.RefreshToken.for_user")
    def test_authenticate_user_success(self, mock_token, mock_get):
        mock_user = Mock(spec=CustomUser)
        mock_user.is_active = True
        mock_user.check_password = Mock(return_value=True)

        mock_get.return_value = mock_user
        mock_refresh = Mock()
        mock_refresh.access_token = "access_token_123"
        mock_token.return_value = mock_refresh

        user, tokens = UserService.authenticate_user(
            email="test@example.com",
            password="MyStr0ng!Pass",
        )

        assert user == mock_user
        assert "refresh" in tokens
        assert "access" in tokens

    @patch("usuarios.services.selectors.get_user_by_email")
    def test_authenticate_user_wrong_password(self, mock_get):
        mock_user = Mock(spec=CustomUser)
        mock_user.check_password = Mock(return_value=False)
        mock_get.return_value = mock_user

        with pytest.raises(InvalidCredentialsError):
            UserService.authenticate_user(
                email="test@example.com",
                password="WrongPassword",
            )

    @patch("usuarios.services.selectors.get_user_by_email")
    def test_authenticate_user_not_found(self, mock_get):
        mock_get.return_value = None

        with pytest.raises(InvalidCredentialsError):
            UserService.authenticate_user(
                email="nonexistent@example.com",
                password="MyStr0ng!Pass",
            )


class TestUserServicePasswordChange:
  
    def test_change_password_wrong_old_password(self):
        mock_user = Mock(spec=CustomUser)
        mock_user.check_password = Mock(return_value=False)

        with pytest.raises(InvalidPasswordError):
            UserService.change_password(
                user=mock_user,
                old_password="WrongOld",
                new_password="NewPass123!",
                new_password_confirm="NewPass123!",
            )

    def test_change_password_mismatch(self):
        mock_user = Mock(spec=CustomUser)
        mock_user.check_password = Mock(return_value=True)

        with pytest.raises(PasswordMismatchError):
            UserService.change_password(
                user=mock_user,
                old_password="OldPass123!",
                new_password="NewPass123!",
                new_password_confirm="Different",
            )

@pytest.mark.django_db
class TestUserServiceIntegration:
    def test_register_and_authenticate_user_flow(self):
        user = UserService.register_user(
            username="integrationtest",
            email="integration@test.com",
            password="IntTest123!",
            password_confirm="IntTest123!",
            first_name="Integration",
            last_name="Test",
        )

        assert user.id is not None
        assert user.email == "integration@test.com"
        assert user.is_active is True

        authenticated_user, tokens = UserService.authenticate_user(
            email="integration@test.com",
            password="IntTest123!",
        )

        assert authenticated_user.id == user.id
        assert tokens["refresh"] is not None
        assert tokens["access"] is not None

    def test_change_password_full_flow(self):
        user = UserService.register_user(
            username="changetest",
            email="changetest@test.com",
            password="OldPass123!",
            password_confirm="OldPass123!",
        )

        UserService.change_password(
            user=user,
            old_password="OldPass123!",
            new_password="NewPass456!",
            new_password_confirm="NewPass456!",
        )

        with pytest.raises(InvalidCredentialsError):
            UserService.authenticate_user(
                email="changetest@test.com",
                password="OldPass123!",
            )

        authenticated_user, tokens = UserService.authenticate_user(
            email="changetest@test.com",
            password="NewPass456!",
        )

        assert authenticated_user.id == user.id
