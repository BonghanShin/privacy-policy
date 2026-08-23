import qrcode from './qrcode.mjs';

const PREFIX = 'XRMC-AI:1:';
const defaults = {
  o: { model: 'gemma-4-32k', endpoint: '' },
  g: { model: 'gemini-3.5-flash-lite', endpoint: '' },
  c: { model: 'claude-haiku-4-5-20251001', endpoint: '' },
};

const form = document.querySelector('#profile-form');
const nameInput = document.querySelector('#profile-name');
const endpointField = document.querySelector('#endpoint-field');
const endpointInput = document.querySelector('#endpoint');
const modelInput = document.querySelector('#model');
const apiKeyInput = document.querySelector('#api-key');
const compactInput = document.querySelector('#compact-prompt');
const showKeyInput = document.querySelector('#show-key');
const errorOutput = document.querySelector('#form-error');
const qrOutput = document.querySelector('#qr-output');
const qrPlaceholder = document.querySelector('#qr-placeholder');
const qrCaption = document.querySelector('#qr-caption');

function selectedProvider() {
  return document.querySelector('input[name="provider"]:checked').value;
}

function utf8Base64Url(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function updateProvider(resetValues = true) {
  const provider = selectedProvider();
  endpointField.hidden = provider !== 'o';
  if (resetValues) {
    modelInput.value = defaults[provider].model;
    endpointInput.value = defaults[provider].endpoint;
  }
}

function clearQr() {
  qrOutput.replaceChildren();
  qrOutput.hidden = true;
  qrCaption.hidden = true;
  qrPlaceholder.hidden = false;
}

function showError(message) {
  errorOutput.textContent = message;
  errorOutput.hidden = false;
  clearQr();
}

document.querySelectorAll('input[name="provider"]').forEach((input) => {
  input.addEventListener('change', () => updateProvider(true));
});

showKeyInput.addEventListener('change', () => {
  apiKeyInput.type = showKeyInput.checked ? 'text' : 'password';
});

document.querySelector('#clear-button').addEventListener('click', () => {
  form.reset();
  apiKeyInput.value = '';
  errorOutput.hidden = true;
  updateProvider(true);
  clearQr();
  nameInput.focus();
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  errorOutput.hidden = true;
  const provider = selectedProvider();
  const profile = {
    v: 1,
    n: nameInput.value.trim(),
    p: provider,
    e: provider === 'o' ? endpointInput.value.trim() : '',
    m: modelInput.value.trim(),
    k: apiKeyInput.value.trim(),
    c: compactInput.checked,
  };

  if (!profile.n || !profile.m) return showError('프로필 이름과 모델을 입력하세요.');
  if (provider === 'o' && !profile.e) return showError('OpenAI 호환 서비스의 서버 주소를 입력하세요.');
  if (provider !== 'o' && !profile.k) return showError('API 키를 입력하세요.');

  const payload = PREFIX + utf8Base64Url(JSON.stringify(profile));
  if (payload.length > 2400) return showError('QR 데이터가 너무 큽니다. API 키나 입력값을 줄이세요.');

  try {
    const code = qrcode(0, 'M');
    code.addData(payload, 'Byte');
    code.make();
    qrOutput.innerHTML = code.createSvgTag({ cellSize: 4, margin: 16, scalable: true });
    qrPlaceholder.hidden = true;
    qrOutput.hidden = false;
    qrCaption.hidden = false;
  } catch (_error) {
    showError('QR을 만들 수 없습니다. 입력값을 줄인 뒤 다시 시도하세요.');
  }
});

updateProvider(true);
