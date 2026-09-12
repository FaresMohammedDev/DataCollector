// === إعدادات Supabase ===
const SUPABASE_URL = 'https://uwglehahxjgbrvfvhvox.supabase.co';
const SUPABASE_KEY = 'sb_publishable_EYOeMFLjxNawT7qX--ztIA_FQTNcslO';

let supabase;

try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (e) {
    console.warn("Please add your Supabase URL and Key.");
}

// ==========================================
// منطق صفحة التسجيل (Form Page) - index.html
// ==========================================
const studentForm = document.getElementById('student-form');
if (studentForm) {
    const submitBtn = document.getElementById('submit-btn');
    const formMessage = document.getElementById('form-message');

    studentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('student-name').value;
        const whatsapp = document.getElementById('whatsapp-number').value;

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin ml-2"></i> جاري الحفظ...';
        submitBtn.classList.add('opacity-75');

        try {
            const { data, error } = await supabase
                .from('students')
                .insert([{ name, whatsapp }]);

            if (error) throw error;

            showMessage('تم حفظ بيانات الطالب بنجاح!', 'bg-green-900 bg-opacity-30 text-green-400 border border-green-800');
            studentForm.reset();
        } catch (error) {
            console.error(error);
            showMessage('حدث خطأ أثناء الحفظ. يرجى المحاولة مرة أخرى.', 'bg-red-900 bg-opacity-30 text-red-400 border border-red-800');
        } finally {
            submitBtn.disabled = false;
            submitBtn.classList.remove('opacity-75');
            submitBtn.innerHTML = 'حفظ الطالب';
        }
    });

    function showMessage(text, colorClasses) {
        formMessage.textContent = text;
        formMessage.className = `text-center text-sm font-bold mt-4 p-3 rounded-lg ${colorClasses}`;
        formMessage.classList.remove('hidden');
        setTimeout(() => formMessage.classList.add('hidden'), 5000);
    }
}

// ==========================================
// منطق صفحة القائمة (List Page) - list.html
// ==========================================
const tableBody = document.getElementById('students-table-body');
if (tableBody) {
    let allStudents = []; 
    let isAuthenticated = false;

    const sectionList = document.getElementById('list-section');
    const modalPassword = document.getElementById('password-modal');
    const inputPassword = document.getElementById('admin-password');
    const btnVerifyPassword = document.getElementById('btn-verify-password');
    const passwordError = document.getElementById('password-error');
    const btnRefresh = document.getElementById('btn-refresh');
    const loadingSpinner = document.getElementById('loading-spinner');
    const searchInput = document.getElementById('search-input');
    const filterSelect = document.getElementById('filter-select');
    const btnExportExcel = document.getElementById('btn-export-excel');

    // التركيز على حقل كلمة المرور عند فتح الصفحة
    if(inputPassword) inputPassword.focus();

    function checkPassword() {
        if (inputPassword.value === '121212') {
            isAuthenticated = true;
            modalPassword.classList.add('hidden');
            sectionList.classList.remove('hidden');
            loadStudents();
        } else {
            passwordError.classList.remove('hidden');
            inputPassword.classList.add('border-red-500');
            setTimeout(() => inputPassword.classList.remove('border-red-500'), 1000);
        }
    }

    if(btnVerifyPassword) btnVerifyPassword.addEventListener('click', checkPassword);
    if(inputPassword) inputPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkPassword();
    });

    if(btnRefresh) btnRefresh.addEventListener('click', loadStudents);

    async function loadStudents() {
        tableBody.innerHTML = '';
        loadingSpinner.classList.remove('hidden');

        try {
            const { data: students, error } = await supabase
                .from('students')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            allStudents = students;
            applyFilters();

        } catch (error) {
            console.error(error);
            tableBody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-red-400">حدث خطأ في جلب البيانات من الخادم</td></tr>';
        } finally {
            loadingSpinner.classList.add('hidden');
        }
    }

    if(searchInput) searchInput.addEventListener('input', applyFilters);
    if(filterSelect) filterSelect.addEventListener('change', applyFilters);

    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const filterValue = filterSelect.value;
        
        const filteredStudents = allStudents.filter(student => {
            const matchSearch = student.name.toLowerCase().includes(searchTerm);
            let matchFilter = true;
            if (filterValue === 'checked') matchFilter = student.is_checked === true;
            if (filterValue === 'unchecked') matchFilter = student.is_checked === false;
            
            return matchSearch && matchFilter;
        });
        
        renderStudents(filteredStudents);
    }

    function renderStudents(studentsToRender) {
        tableBody.innerHTML = '';

        if (studentsToRender.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" class="p-8 text-center text-gray-500 font-medium">لا توجد بيانات مطابقة</td></tr>';
            return;
        }

        studentsToRender.forEach(student => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-[#1e293b] transition duration-150';
            
            const dateOptions = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            const date = new Date(student.created_at).toLocaleDateString('ar-EG', dateOptions);
            
            let cleanNumber = student.whatsapp.replace(/[^\d+]/g, '');

            const textStyle = student.is_checked ? 'line-through text-gray-500' : 'text-gray-200 font-medium';
            const checkBtnClass = student.is_checked 
                ? 'bg-[#1e293b] text-gray-400 hover:bg-[#2a364a] border border-gray-600' 
                : 'bg-green-600 text-white hover:bg-green-500';

            row.innerHTML = `
                <td class="p-4 ${textStyle}">${student.name}</td>
                <td class="p-4 text-gray-400" dir="ltr"><span class="${student.is_checked ? 'text-gray-600' : ''}">${student.whatsapp}</span></td>
                <td class="p-4 text-gray-400 text-sm whitespace-nowrap">${date}</td>
                <td class="p-4">
                    <div class="flex justify-center gap-2">
                        <button onclick="toggleCheck(${student.id}, ${student.is_checked})" class="${checkBtnClass} w-10 h-10 rounded-lg flex items-center justify-center transition tooltip shadow-sm" title="${student.is_checked ? 'إلغاء التحديد' : 'تحديد كمنجز'}">
                            <i class="fas ${student.is_checked ? 'fa-undo' : 'fa-check'}"></i>
                        </button>
                        <a href="https://wa.me/${cleanNumber}" target="_blank" rel="noopener noreferrer" class="bg-blue-600 hover:bg-blue-500 text-white w-10 h-10 rounded-lg flex items-center justify-center transition shadow-md" title="مراسلة واتساب">
                            <i class="fab fa-whatsapp text-xl"></i>
                        </a>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    window.toggleCheck = async (id, currentState) => {
        loadingSpinner.classList.remove('hidden');
        try {
            const { error } = await supabase
                .from('students')
                .update({ is_checked: !currentState })
                .eq('id', id);

            if (error) throw error;
            
            const studentIndex = allStudents.findIndex(s => s.id === id);
            if (studentIndex > -1) {
                allStudents[studentIndex].is_checked = !currentState;
            }
            
            applyFilters();

        } catch (error) {
            console.error('Error updating status:', error);
            alert('حدث خطأ أثناء تحديث حالة الطالب');
        } finally {
            loadingSpinner.classList.add('hidden');
        }
    };

    if(btnExportExcel) {
        btnExportExcel.addEventListener('click', () => {
            if (allStudents.length === 0) {
                alert('لا توجد بيانات لتصديرها!');
                return;
            }

            const searchTerm = searchInput.value.toLowerCase().trim();
            const filterValue = filterSelect.value;
            
            const filteredForExport = allStudents.filter(student => {
                const matchSearch = student.name.toLowerCase().includes(searchTerm);
                let matchFilter = true;
                if (filterValue === 'checked') matchFilter = student.is_checked === true;
                if (filterValue === 'unchecked') matchFilter = student.is_checked === false;
                return matchSearch && matchFilter;
            });

            if (filteredForExport.length === 0) {
                alert('القائمة الحالية فارغة لتصديرها!');
                return;
            }

            const excelData = filteredForExport.map(student => {
                const dateOptions = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
                return {
                    'اسم الطالب': student.name,
                    'رقم الواتساب': student.whatsapp,
                    'الحالة': student.is_checked ? 'تم الإنجاز' : 'لم يتم الإنجاز',
                    'تاريخ التسجيل': new Date(student.created_at).toLocaleDateString('ar-EG', dateOptions)
                };
            });

            const worksheet = XLSX.utils.json_to_sheet(excelData);
            
            if(!worksheet['!cols']) worksheet['!cols'] = [];
            worksheet['!dir'] = 'rtl'; 

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "بيانات الطلاب");
            
            XLSX.writeFile(workbook, "بيانات_الطلاب.xlsx");
        });
    }
}
