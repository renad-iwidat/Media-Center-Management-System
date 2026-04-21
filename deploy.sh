#!/bin/bash

# ============================================================
# سكريبت النشر التلقائي (Automated Deployment Script)
# ============================================================

set -e  # إيقاف عند أي خطأ

# الألوان للطباعة
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# دوال مساعدة
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# التحقق من المتطلبات
check_requirements() {
    print_info "التحقق من المتطلبات..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker غير مثبت!"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose غير مثبت!"
        exit 1
    fi
    
    if [ ! -f .env ]; then
        print_error "ملف .env غير موجود!"
        print_info "قم بنسخ .env.example إلى .env وتعديله"
        exit 1
    fi
    
    print_success "جميع المتطلبات متوفرة"
}

# نسخ احتياطي
backup() {
    print_info "إنشاء نسخة احتياطية..."
    
    BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # نسخ ملف .env
    cp .env "$BACKUP_DIR/.env.backup"
    
    # نسخ السجلات إذا كانت موجودة
    if docker ps -q -f name=media-backend &> /dev/null; then
        docker logs media-backend > "$BACKUP_DIR/backend.log" 2>&1 || true
        docker logs media-frontend > "$BACKUP_DIR/frontend.log" 2>&1 || true
    fi
    
    print_success "تم إنشاء النسخة الاحتياطية في: $BACKUP_DIR"
}

# إيقاف الخدمات القديمة
stop_services() {
    print_info "إيقاف الخدمات القديمة..."
    docker-compose down || true
    print_success "تم إيقاف الخدمات"
}

# بناء الصور
build_images() {
    print_info "بناء الصور الجديدة..."
    
    if [ "$1" == "--no-cache" ]; then
        docker-compose build --no-cache
    else
        docker-compose build
    fi
    
    print_success "تم بناء الصور"
}

# تشغيل الخدمات
start_services() {
    print_info "تشغيل الخدمات..."
    
    if [ "$1" == "prod" ]; then
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
    else
        docker-compose up -d
    fi
    
    print_success "تم تشغيل الخدمات"
}

# انتظار الخدمات
wait_for_services() {
    print_info "انتظار جاهزية الخدمات..."
    
    # انتظار Backend
    for i in {1..30}; do
        if curl -s http://localhost:4000/health > /dev/null 2>&1; then
            print_success "Backend جاهز"
            break
        fi
        
        if [ $i -eq 30 ]; then
            print_error "Backend لم يصبح جاهزاً"
            docker-compose logs backend
            exit 1
        fi
        
        sleep 2
    done
    
    # انتظار Frontend
    for i in {1..30}; do
        if curl -s http://localhost/dashboard/ > /dev/null 2>&1; then
            print_success "Frontend جاهز"
            break
        fi
        
        if [ $i -eq 30 ]; then
            print_error "Frontend لم يصبح جاهزاً"
            docker-compose logs frontend
            exit 1
        fi
        
        sleep 2
    done
}

# فحص الصحة
health_check() {
    print_info "فحص صحة الخدمات..."
    
    # فحص Backend
    BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/health)
    if [ "$BACKEND_STATUS" == "200" ]; then
        print_success "Backend: صحي (200)"
    else
        print_error "Backend: غير صحي ($BACKEND_STATUS)"
        return 1
    fi
    
    # فحص Frontend
    FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/dashboard/)
    if [ "$FRONTEND_STATUS" == "200" ]; then
        print_success "Frontend: صحي (200)"
    else
        print_error "Frontend: غير صحي ($FRONTEND_STATUS)"
        return 1
    fi
    
    return 0
}

# عرض الحالة
show_status() {
    print_info "حالة الخدمات:"
    docker-compose ps
    
    echo ""
    print_info "الوصول للتطبيق:"
    echo "  🌐 Frontend: http://localhost/dashboard/"
    echo "  🔌 Backend:  http://localhost:4000"
    echo "  💚 Health:   http://localhost:4000/health"
}

# التنظيف
cleanup() {
    print_info "تنظيف الموارد غير المستخدمة..."
    docker system prune -f
    print_success "تم التنظيف"
}

# الدالة الرئيسية
main() {
    echo ""
    print_info "=========================================="
    print_info "   بدء عملية النشر (Deployment)"
    print_info "=========================================="
    echo ""
    
    # معالجة الخيارات
    MODE="dev"
    NO_CACHE=""
    SKIP_BACKUP=""
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --prod)
                MODE="prod"
                shift
                ;;
            --no-cache)
                NO_CACHE="--no-cache"
                shift
                ;;
            --skip-backup)
                SKIP_BACKUP="true"
                shift
                ;;
            --help)
                echo "الاستخدام: ./deploy.sh [OPTIONS]"
                echo ""
                echo "الخيارات:"
                echo "  --prod          النشر في وضع الإنتاج"
                echo "  --no-cache      بناء بدون cache"
                echo "  --skip-backup   تخطي النسخ الاحتياطي"
                echo "  --help          عرض هذه المساعدة"
                exit 0
                ;;
            *)
                print_error "خيار غير معروف: $1"
                echo "استخدم --help لعرض الخيارات المتاحة"
                exit 1
                ;;
        esac
    done
    
    # تنفيذ الخطوات
    check_requirements
    
    if [ -z "$SKIP_BACKUP" ]; then
        backup
    fi
    
    stop_services
    build_images "$NO_CACHE"
    start_services "$MODE"
    wait_for_services
    
    if health_check; then
        echo ""
        print_success "=========================================="
        print_success "   النشر تم بنجاح! 🎉"
        print_success "=========================================="
        echo ""
        show_status
        echo ""
        
        if [ -z "$SKIP_BACKUP" ]; then
            print_info "النسخة الاحتياطية محفوظة في: backups/"
        fi
        
        print_info "لعرض السجلات: docker-compose logs -f"
    else
        print_error "فشل فحص الصحة!"
        print_info "عرض السجلات:"
        docker-compose logs
        exit 1
    fi
}

# تشغيل السكريبت
main "$@"
