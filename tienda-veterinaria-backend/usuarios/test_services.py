"""
usuarios/test_services.py

Tests unitarios para la capa de servicios de usuarios.
Todos estos tests usan mocking y no requieren DB.
"""

import pytest
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from unittest.mock import Mock, patch, MagicMock

from .services import UserService
from .exceptions import (
    UserAlreadyExistsError,
    UserNotFoundError,
    InvalidPasswordError,
    PasswordMismatchError,
    InvalidCredentialsError,
)

CustomUser = get_user_model()


class TestUserServicePasswordValidation:
    """Tests para validación de contraseñas."""

    def test_validate_password_strength_valid(self):
        """Válida acepte contraseña fuerte."""
        # No debe lanzar excepción
        UserService.validate_password_strength("MyStr0ng!Pass")

    def test_validate_password_strength_too_short(self):
        """Devuelve error si contraseña es muy corta."""
        with pytest.raises(InvalidPasswordError):
            UserService.validate_password_strength("123")

    def test_validate_password_strength_common(self):
        """Rechaza contraseñas comunes."""
        with pytest.raises(InvalidPasswordError):
            UserService.validate_password_strength("password123")


class TestUserServiceRegistration:
    """Tests para registro de usuarios."""

    @patch("usuarios.services.selectors.user_exists")
    @patch("usuarios.services.CustomUser.objects.create_user")
    def test_register_user_success(self, mock_create, mock_exists):
        """Registra usuario exitosamente."""
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
        """Rechaza registro si contraseñas no coinciden."""
        with pytest.raises(PasswordMismatchError):
            UserService.register_user(
                username="testuser",
                email="test@example.com",
                password="MyStr0ng!Pass",
                password_confirm="DifferentPass",
            )

    @patch("usuarios.services.selectors.user_exists")
    def test_register_user_already_exists(self, mock_exists):
        """Rechaza registro si usuario existe."""
        mock_exists.return_value = True

        with pytest.raises(UserAlreadyExistsError):
            UserService.register_user(
                username="testuser",
                email="test@example.com",
                password="MyStr0ng!Pass",
                password_confirm="MyStr0ng!Pass",
            )


class TestUserServiceAuthentication:
    """Tests para autenticación."""

    @patch("usuarios.services.selectors.get_user_by_email")
    @patch("usuarios.services.RefreshToken.for_user")
    def test_authenticate_user_success(self, mock_token, mock_get):
        """Autentica usuario exitosamente."""
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
        """Rechaza login con contraseña incorrecta."""
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
        """Rechaza login si usuario no existe."""
        mock_get.return_value = None

        with pytest.raises(InvalidCredentialsError):
            UserService.authenticate_user(
                email="nonexistent@example.com",
                password="MyStr0ng!Pass",
            )


class TestUserServicePasswordChange:
    """Tests para cambio de contraseña."""

    def test_change_password_wrong_old_password(self):
        """Rechaza cambio si contraseña actual es incorrecta."""
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
        """Rechaza cambio si nuevas contraseñas no coinciden."""
        mock_user = Mock(spec=CustomUser)
        mock_user.check_password = Mock(return_value=True)

        with pytest.raises(PasswordMismatchError):
            UserService.change_password(
                user=mock_user,
                old_password="OldPass123!",
                new_password="NewPass123!",
                new_password_confirm="Different",
            )


# Integration Tests (requieren DB)
@pytest.mark.django_db
class TestUserServiceIntegration:
    """Tests de integración que usan la DB real."""

    def test_register_and_authenticate_user_flow(self):
        """Test el flujo completo: registro + login."""
        # Registro
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

        # Login
        authenticated_user, tokens = UserService.authenticate_user(
            email="integration@test.com",
            password="IntTest123!",
        )

        assert authenticated_user.id == user.id
        assert tokens["refresh"] is not None
        assert tokens["access"] is not None

    def test_change_password_full_flow(self):
        """Test cambio de contraseña completo."""
        # Crear usuario
        user = UserService.register_user(
            username="changetest",
            email="changetest@test.com",
            password="OldPass123!",
            password_confirm="OldPass123!",
        )

        # Cambiar contraseña
        UserService.change_password(
            user=user,
            old_password="OldPass123!",
            new_password="NewPass456!",
            new_password_confirm="NewPass456!",
        )

        # Verificar que el login con la vieja contraseña falla
        with pytest.raises(InvalidCredentialsError):
            UserService.authenticate_user(
                email="changetest@test.com",
                password="OldPass123!",
            )

        # Verificar que el login con la nueva contraseña funciona
        authenticated_user, tokens = UserService.authenticate_user(
            email="changetest@test.com",
            password="NewPass456!",
        )

        assert authenticated_user.id == user.id
