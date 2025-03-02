// Elementos do DOM
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const desktopView = document.getElementById('desktop-view');
const mobileView = document.getElementById('mobile-view');
const tableBody = document.getElementById('table-body');
const mobileList = document.getElementById('mobile-list');
const noResults = document.getElementById('no-results');
const searchInput = document.getElementById('search-input');

// Estado da aplicação
let employees = [];
let filteredEmployees = [];
let isMobile = window.innerWidth <= 768;

/**
 * Formata uma data no formato DD/MM/YYYY
 * @param {string} dateString - Data no formato ISO ou outra string de data válida
 * @returns {string} Data formatada
 */
function formatDate(dateString) {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      return dateString; // Retorna a string original se não for uma data válida
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return dateString;
  }
}

/**
 * Formata um número de telefone no padrão +XX (XX) XXXXX-XXXX
 * @param {string} phoneNumber - Número de telefone
 * @returns {string} Telefone formatado
 */
function formatPhone(phoneNumber) {
  if (!phoneNumber) return '';
  
  try {
    // Remove todos os caracteres não numéricos
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Se o número tiver menos de 10 dígitos, retorna o original
    if (cleanNumber.length < 10) {
      return phoneNumber;
    }
    
    // Formato padrão brasileiro com código de país +55
    if (cleanNumber.length === 11) { // Com 9º dígito
      return `+55 (${cleanNumber.substring(0, 2)}) ${cleanNumber.substring(2, 7)}-${cleanNumber.substring(7)}`;
    } else if (cleanNumber.length === 10) { // Sem 9º dígito
      return `+55 (${cleanNumber.substring(0, 2)}) ${cleanNumber.substring(2, 6)}-${cleanNumber.substring(6)}`;
    } else if (cleanNumber.length > 11) { // Número internacional
      // Assumindo que os primeiros 2 dígitos são o código do país
      const countryCode = cleanNumber.substring(0, 2);
      const areaCode = cleanNumber.substring(2, 4);
      const firstPart = cleanNumber.substring(4, 9);
      const lastPart = cleanNumber.substring(9);
      
      return `+${countryCode} (${areaCode}) ${firstPart}-${lastPart}`;
    }
    
    // Fallback para outros formatos
    return phoneNumber;
  } catch (error) {
    console.error('Erro ao formatar telefone:', error);
    return phoneNumber;
  }
}

/**
 * Busca os dados de funcionários da API ou do arquivo db.json
 */
async function fetchEmployees() {
  try {
    showLoading();
    
    // Tenta obter dados da API primeiro - corrigido para '/employees'
    try {
      const response = await fetch('http://localhost:3000/employees');
      
      if (response.ok) {
        const data = await response.json();
        employees = data;
        filteredEmployees = data;
        
        renderEmployees();
        hideLoading();
        return;
      }
    } catch (apiError) {
      console.log('API não disponível, tentando arquivo local db.json');
    }
    
    // Se não conseguir obter da API, tenta carregar o arquivo local
    try {
      const response = await fetch('db/db.json');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Verificar se o arquivo tem a estrutura esperada: employees
      if (data.employees && Array.isArray(data.employees)) {
        employees = data.employees;
      } else if (Array.isArray(data)) {
        // Caso o JSON seja diretamente um array
        employees = data;
      } else {
        // Se não tiver a estrutura esperada, assume array vazio
        console.error('Formato de dados inesperado');
        employees = [];
      }
      
      filteredEmployees = [...employees];
      
      renderEmployees();
      hideLoading();
    } catch (error) {
      throw new Error(`Erro ao carregar dados: ${error.message}`);
    }
  } catch (error) {
    showError(error.message);
  }
}

/**
 * Filtra os funcionários com base na consulta de pesquisa
 */
function filterEmployees() {
  const query = searchInput.value.toLowerCase();
  
  if (query) {
    filteredEmployees = employees.filter(employee => {
      return (
        employee.name.toLowerCase().includes(query) ||
        employee.job.toLowerCase().includes(query) ||
        employee.phone.toLowerCase().includes(query)
      );
    });
  } else {
    filteredEmployees = [...employees];
  }
  
  renderEmployees();
}

/**
 * Renderiza os funcionários na interface com base no tamanho da tela
 */
function renderEmployees() {
  if (filteredEmployees.length === 0) {
    hideDesktopView();
    hideMobileView();
    showNoResults();
    return;
  }
  
  hideNoResults();
  
  if (isMobile) {
    renderMobileView();
  } else {
    renderDesktopView();
  }
}

/**
 * Renderiza a visualização desktop (tabela)
 */
function renderDesktopView() {
  tableBody.innerHTML = '';
  
  filteredEmployees.forEach(employee => {
    // Verifica se a imagem é uma URL externa ou um caminho relativo
    const imageSrc = employee.image.startsWith('http') 
      ? employee.image 
      : `assets/images/${employee.image}`;
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <img src="${imageSrc}" alt="Foto de ${employee.name}" class="employee-photo">
      </td>
      <td>${employee.name}</td>
      <td>${employee.job}</td>
      <td>${formatDate(employee.admission_date)}</td>
      <td>${formatPhone(employee.phone)}</td>
    `;
    
    tableBody.appendChild(row);
  });
  
  showDesktopView();
  hideMobileView();
}

/**
 * Renderiza a visualização mobile (cards)
 */
function renderMobileView() {
  mobileList.innerHTML = '';
  
  filteredEmployees.forEach(employee => {
    // CORREÇÃO: Adicionando a mesma verificação de caminho de imagem que existe no renderDesktopView
    const imageSrc = employee.image.startsWith('http') 
      ? employee.image 
      : `assets/images/${employee.image}`;
    
    const card = document.createElement('div');
    card.className = 'employee-card';
    card.dataset.id = employee.id;
    
    card.innerHTML = `
      <div class="card-header" onclick="toggleCardDetails(${employee.id})">
        <div class="employee-photo-container">
          <img src="${imageSrc}" alt="Foto de ${employee.name}" class="employee-photo">
        </div>
        <div class="employee-name">${employee.name}</div>
        <div class="expand-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 12 8" fill="none">
            <path d="M1.41 0.59L6 5.17L10.59 0.59L12 2L6 8L0 2L1.41 0.59Z" fill="#0950FF"/>
          </svg>
        </div>
      </div>
    `;
    
    mobileList.appendChild(card);
  });
  
  hideDesktopView();
  showMobileView();
}

/**
 * Alterna a exibição dos detalhes do card
 * @param {number} employeeId - ID do funcionário
 */
function toggleCardDetails(employeeId) {
  const card = document.querySelector(`.employee-card[data-id="${employeeId}"]`);
  const existingDetails = card.querySelector('.card-details');
  const expandIcon = card.querySelector('.expand-icon');
  
  // Se já existir um detalhe, remove
  if (existingDetails) {
    card.removeChild(existingDetails);
    expandIcon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="8" viewBox="0 0 12 8" fill="none">
        <path d="M1.41 0.59L6 5.17L10.59 0.59L12 2L6 8L0 2L1.41 0.59Z" fill="#9E9E9E"/>
      </svg>
    `;
    return;
  }
  
  // Caso contrário, adiciona os detalhes
  const employee = employees.find(emp => emp.id === employeeId);
  
  if (employee) {
    const details = document.createElement('div');
    details.className = 'card-details';
    
    details.innerHTML = `
      <div class="detail-row">
        <div class="detail-label">Cargo</div>
        <div class="detail-value">${employee.job}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Data de admissão</div>
        <div class="detail-value">${formatDate(employee.admission_date)}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Telefone</div>
        <div class="detail-value">${formatPhone(employee.phone)}</div>
      </div>
    `;
    
    card.appendChild(details);
    
    expandIcon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 12 8" fill="none">
  <path d="M1.41 7.41L6 2.83L10.59 7.41L12 6L6 0L0 6L1.41 7.41Z" fill="#0950FF"/>
</svg>
    `;
  }
}

/**
 * Funções para controlar a exibição dos estados da interface
 */
function showLoading() {
  loadingState.style.display = 'block';
  errorState.style.display = 'none';
  desktopView.style.display = 'none';
  mobileView.style.display = 'none';
  noResults.style.display = 'none';
}

function hideLoading() {
  loadingState.style.display = 'none';
}

function showError(message) {
  errorMessage.textContent = message;
  errorState.style.display = 'block';
  loadingState.style.display = 'none';
  desktopView.style.display = 'none';
  mobileView.style.display = 'none';
  noResults.style.display = 'none';
}

function showDesktopView() {
  desktopView.style.display = 'block';
}

function hideDesktopView() {
  desktopView.style.display = 'none';
}

function showMobileView() {
  mobileView.style.display = 'block';
}

function hideMobileView() {
  mobileView.style.display = 'none';
}

function showNoResults() {
  noResults.style.display = 'block';
}

function hideNoResults() {
  noResults.style.display = 'none';
}

/**
 * Verifica se a visualização deve ser mobile ou desktop
 */
function checkViewportSize() {
  const wasMobile = isMobile;
  isMobile = window.innerWidth <= 768;
  
  // Se houver mudança no tipo de visualização, renderiza novamente
  if (wasMobile !== isMobile) {
    renderEmployees();
  }
}

// Event listeners
window.addEventListener('load', fetchEmployees);
window.addEventListener('resize', checkViewportSize);
searchInput.addEventListener('input', filterEmployees);

// Adiciona função toggleCardDetails ao objeto window para poder ser chamada pelo onclick
window.toggleCardDetails = toggleCardDetails;