"""
Crypto Utilities - Encryption, decryption, and hashing utilities.

This module provides cryptographic utilities for secure data handling
including encryption, decryption, and password hashing.
"""

import base64
import hashlib
import secrets
from typing import Optional

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2

from scripts.core.exceptions import ValidationError
from scripts.core.logger import get_logger

logger = get_logger(__name__)


def generate_key() -> str:
    """
    Generate a new encryption key.

    Returns:
        Base64-encoded encryption key
    """
    key = Fernet.generate_key()
    return key.decode()


def derive_key_from_password(password: str, salt: Optional[bytes] = None) -> tuple[str, str]:
    """
    Derive encryption key from password.

    Args:
        password: Password string
        salt: Optional salt bytes (generated if not provided)

    Returns:
        Tuple of (key, salt) as base64-encoded strings
    """
    if salt is None:
        salt = secrets.token_bytes(16)

    kdf = PBKDF2(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )

    key = base64.urlsafe_b64encode(kdf.derive(password.encode()))

    return key.decode(), base64.b64encode(salt).decode()


def encrypt_data(data: str, key: str) -> str:
    """
    Encrypt data using Fernet symmetric encryption.

    Args:
        data: Data to encrypt
        key: Base64-encoded encryption key

    Returns:
        Base64-encoded encrypted data

    Raises:
        ValidationError: If encryption fails
    """
    try:
        fernet = Fernet(key.encode())
        encrypted = fernet.encrypt(data.encode())
        return encrypted.decode()

    except Exception as e:
        logger.error(f"Encryption failed: {e}", exc_info=True)
        raise ValidationError(
            "Failed to encrypt data",
            original_error=e,
        ) from e


def decrypt_data(encrypted_data: str, key: str) -> str:
    """
    Decrypt data using Fernet symmetric encryption.

    Args:
        encrypted_data: Base64-encoded encrypted data
        key: Base64-encoded encryption key

    Returns:
        Decrypted data as string

    Raises:
        ValidationError: If decryption fails
    """
    try:
        fernet = Fernet(key.encode())
        decrypted = fernet.decrypt(encrypted_data.encode())
        return decrypted.decode()

    except Exception as e:
        logger.error(f"Decryption failed: {e}", exc_info=True)
        raise ValidationError(
            "Failed to decrypt data",
            original_error=e,
        ) from e


def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    """
    Hash password using PBKDF2-SHA256.

    Args:
        password: Password to hash
        salt: Optional salt (generated if not provided)

    Returns:
        Tuple of (hash, salt) as hex strings
    """
    if salt is None:
        salt_bytes = secrets.token_bytes(16)
        salt = salt_bytes.hex()
    else:
        salt_bytes = bytes.fromhex(salt)

    # Use PBKDF2 for password hashing
    kdf = PBKDF2(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt_bytes,
        iterations=100000,
    )

    password_hash = kdf.derive(password.encode())

    return password_hash.hex(), salt


def verify_password(password: str, password_hash: str, salt: str) -> bool:
    """
    Verify password against hash.

    Args:
        password: Password to verify
        password_hash: Stored password hash
        salt: Salt used for hashing

    Returns:
        True if password matches, False otherwise
    """
    try:
        computed_hash, _ = hash_password(password, salt)
        return secrets.compare_digest(computed_hash, password_hash)
    except Exception as e:
        logger.error(f"Password verification failed: {e}")
        return False


def hash_string(data: str, algorithm: str = "sha256") -> str:
    """
    Hash string using specified algorithm.

    Args:
        data: Data to hash
        algorithm: Hash algorithm (md5, sha1, sha256, sha512)

    Returns:
        Hex digest of hash

    Raises:
        ValidationError: If algorithm is not supported
    """
    try:
        hash_func = getattr(hashlib, algorithm)
        return hash_func(data.encode()).hexdigest()

    except AttributeError:
        raise ValidationError(
            f"Unsupported hash algorithm: {algorithm}",
            field="algorithm",
            value=algorithm,
        )


def generate_token(length: int = 32) -> str:
    """
    Generate random secure token.

    Args:
        length: Token length in bytes

    Returns:
        Hex-encoded random token
    """
    return secrets.token_hex(length)


def generate_url_safe_token(length: int = 32) -> str:
    """
    Generate URL-safe random token.

    Args:
        length: Token length in bytes

    Returns:
        URL-safe random token
    """
    return secrets.token_urlsafe(length)


def constant_time_compare(a: str, b: str) -> bool:
    """
    Compare two strings in constant time.

    Args:
        a: First string
        b: Second string

    Returns:
        True if strings are equal, False otherwise
    """
    return secrets.compare_digest(a.encode(), b.encode())
