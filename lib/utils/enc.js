'use strict';

const crypto = require('crypto');

/**
 * Takes in a string and a public rsa key and returns a string that has been encrypted using the public rsa key.
 *
 * @param  {String} toEncrypt The value to be encrypted
 * @param  {String} publicKey The RSA public key to use for the encryption
 *
 * @return {String}           The encrypted value of toEncrypt using publicKey
 */
function encryptStringWithRsaPublicKey(toEncrypt, publicKey) {
  if (!toEncrypt || !publicKey) {
    return null;
  }

  return crypto.publicEncrypt(publicKey, new Buffer(toEncrypt)).toString('base64');
}

/**
 * Takes in an encrypted string and private RSA key and returns the decrypted version of the toDecrypt value if the
 *  private key is correct or an error otherwise.
 *
 * @param  {String} toDecrypt  The encrypted string to be decrypted
 * @param  {String} privateKey The private RSA key to use when decrypting
 *
 * @return {String}            The decrypted value of toDecrypt using privateKey, null if parameters are omitted and
 * error if the key was not used to encrypt the given value.
 */
function decryptStringWithRsaPrivateKey(toDecrypt, privateKey) {
  if (!toDecrypt || !privateKey) {
    return null;
  }

  return crypto.privateDecrypt(privateKey, new Buffer(toDecrypt, 'base64')).toString('utf8');
}

module.exports = {
  encrypt: encryptStringWithRsaPublicKey,
  decrypt: decryptStringWithRsaPrivateKey,
};
