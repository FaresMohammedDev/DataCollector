// === إعدادات Supabase ===
const SUPABASE_URL = 'https://uwglehahxjgbrvfvhvox.supabase.co';
const SUPABASE_KEY = 'sb_publishable_EYOeMFLjxNawT7qX--ztIA_FQTNcslO';

let db;

try {
    db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (e) {
    console.warn("Please add your Supabase URL and Key.");
}

// === العناصر ===
const formSection = document.getElementById('form-section');
const listSection = document.getElementById('list-section');
const studentForm = document.getElementById('student-form');
const submitBtn = document.getElementById('submit-btn');
const formMessage = document.getElementById('form-message');
const btnBackForm = document.getElementById('btn-back-form');
const tableBody = document.getElementById('students-table-body');
const btnRefresh = document.getElementById('btn-refresh');
const loadingSpinner = document.getElementById('loading-spinner');
const searchInput = document.getElementById('search-input');
const filterSelect = document.getElementById('filter-select');
const btnExportExcel = document.getElementById('btn-export-excel');

let allStudents = []; 

// ==========================================
// منطق الفورم والدخول السري (Backdoor)
// ==========================================
studentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nameVal = document.getElementById('student-name').value.trim();
    const whatsapp = document.getElementById('whatsapp-number').value.trim();

        // 🚀 الفكرة الجديدة: فتح قائمة الطلاب إذا تم إدخال اسم ورقم معين (غير حساس لحالة الأحرف)
        if (nameVal.toLowerCase() === 'iam-fares' && whatsapp === '121212') {
            // تفريغ الحقول وإخفاء الفورم وفتح القائمة السري
            studentForm.reset();
            formMessage.classList.add('hidden');
            formSection.classList.add('hidden');
            listSection.classList.remove('hidden');
            loadStudents();
            return; // إيقاف العملية هنا لعدم حفظ هذا الإدخال في الداتا بيز
        }

        // ============ إضافة مفتاح الدولة تلقائياً ============
        let formattedPhone = whatsapp.replace(/[^\d+]/g, '');
        if (formattedPhone.startsWith('0020')) {
            formattedPhone = '+' + formattedPhone.substring(2);
        } else if (formattedPhone.startsWith('0')) {
            formattedPhone = '+20' + formattedPhone.substring(1);
        } else if (!formattedPhone.startsWith('+20') && !formattedPhone.startsWith('20')) {
            formattedPhone = '+20' + formattedPhone;
        } else if (formattedPhone.startsWith('20')) {
            formattedPhone = '+' + formattedPhone;
        }
        // =====================================================

        // التنفيذ الطبيعي لحفظ الطالب إذا لم يكن الباسورد السري
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin ml-2"></i> جاري الحفظ...';
        submitBtn.classList.add('opacity-75');

        try {
            const { data, error } = await db
                .from('students')
                .insert([{ name: nameVal, whatsapp: formattedPhone }]);

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

// العودة من القائمة إلى الفورم
btnBackForm.addEventListener('click', () => {
    listSection.classList.add('hidden');
    formSection.classList.remove('hidden');
});

function showMessage(text, colorClasses) {
    formMessage.textContent = text;
    formMessage.className = `text-center text-sm font-bold mt-4 p-3 rounded-lg ${colorClasses}`;
    formMessage.classList.remove('hidden');
    setTimeout(() => formMessage.classList.add('hidden'), 5000);
}

// ==========================================
// عمليات القائمة (اللوحة الإدارية)
// ==========================================
btnRefresh.addEventListener('click', loadStudents);
searchInput.addEventListener('input', applyFilters);
filterSelect.addEventListener('change', applyFilters);

async function loadStudents() {
    tableBody.innerHTML = '';
    loadingSpinner.classList.remove('hidden');

    try {
        const { data: students, error } = await db
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
        tableBody.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-gray-500 font-medium">لا توجد بيانات مطابقة</td></tr>';
        return;
    }

    studentsToRender.forEach((student, index) => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-[#1e293b] transition duration-150';
        
        const dateOptions = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        const date = new Date(student.created_at).toLocaleDateString('ar-EG', dateOptions);
        
        let cleanNumber = student.whatsapp.replace(/[^\d]/g, '');
        if (cleanNumber.startsWith('0020')) cleanNumber = cleanNumber.substring(2);
        else if (cleanNumber.startsWith('0')) cleanNumber = cleanNumber.substring(1);
        if (!cleanNumber.startsWith('20')) cleanNumber = '20' + cleanNumber;

        const textStyle = student.is_checked ? 'line-through text-gray-500' : 'text-gray-200 font-medium';
        const checkBtnClass = student.is_checked 
            ? 'bg-[#1e293b] text-gray-400 hover:bg-[#2a364a] border border-gray-600' 
            : 'bg-green-600 text-white hover:bg-green-500';

        row.innerHTML = `
            <td class="p-4 text-gray-500 text-center font-bold">${index + 1}</td>
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
                    <button onclick="deleteStudent(${student.id})" class="bg-red-900 bg-opacity-40 text-red-400 hover:bg-red-600 hover:text-white border border-red-900 w-10 h-10 rounded-lg flex items-center justify-center transition shadow-sm" title="حذف الطالب">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

window.toggleCheck = async (id, currentState) => {
    loadingSpinner.classList.remove('hidden');
    try {
        const { error } = await db
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

window.deleteStudent = async (id) => {
    if (!confirm('هل أنت متأكد من حذف بيانات هذا الطالب نهائياً؟')) return;
    
    loadingSpinner.classList.remove('hidden');
    try {
        const { error } = await db
            .from('students')
            .delete()
            .eq('id', id);

        if (error) throw error;
        
        allStudents = allStudents.filter(s => s.id !== id);
        applyFilters();

    } catch (error) {
        console.error('Error deleting student:', error);
        alert('حدث خطأ أثناء الحذف. يرجى التأكد من صلاحيات قاعدة البيانات (RLS).');
    } finally {
        loadingSpinner.classList.add('hidden');
    }
};

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
