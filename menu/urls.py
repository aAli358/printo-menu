from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RestaurantViewSet, CategoryViewSet, MenuItemViewSet, TableCallViewSet,
    MenuItemReviewViewSet, ExperienceReviewViewSet, OrderViewSet, RestaurantTableViewSet,
    HealthView,
)
from .auth_views import RegisterView, MeView, TenantTokenObtainPairView, AuthHandoffCreateView, AuthHandoffConsumeView
from .contact_views import ContactView
from .platform_views import PlatformBrandingPublicView
from .feature_views import (
    TenantAnalyticsView, PlatformStatsView, PlatformRestaurantViewSet,
    PromotionViewSet, TableReservationViewSet, WaitlistViewSet,
    MenuItemVariantViewSet, AddonGroupViewSet, AddonViewSet,
    CategoryReorderView, MenuItemReorderView,
    RestaurantStaffViewSet, ReportsExportView, MenuExportView, MenuImportView,
)

router = DefaultRouter()
router.register(r'restaurants', RestaurantViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'items', MenuItemViewSet)
router.register(r'tables', RestaurantTableViewSet)
router.register(r'table-calls', TableCallViewSet)
router.register(r'reviews', MenuItemReviewViewSet)
router.register(r'experience-reviews', ExperienceReviewViewSet)
router.register(r'orders', OrderViewSet)
router.register(r'promotions', PromotionViewSet)
router.register(r'reservations', TableReservationViewSet)
router.register(r'waitlist', WaitlistViewSet)
router.register(r'variants', MenuItemVariantViewSet)
router.register(r'addon-groups', AddonGroupViewSet)
router.register(r'addons', AddonViewSet)
router.register(r'staff', RestaurantStaffViewSet, basename='restaurant-staff')
router.register(r'platform/restaurants', PlatformRestaurantViewSet, basename='platform-restaurants')

urlpatterns = [
    path('health/', HealthView.as_view(), name='health'),
    path('analytics/', TenantAnalyticsView.as_view(), name='tenant-analytics'),
    path('reports/export/', ReportsExportView.as_view(), name='reports-export'),
    path('platform/stats/', PlatformStatsView.as_view(), name='platform-stats'),
    path('categories/reorder/', CategoryReorderView.as_view(), name='categories-reorder'),
    path('items/reorder/', MenuItemReorderView.as_view(), name='items-reorder'),
    path('menu/export/', MenuExportView.as_view(), name='menu-export'),
    path('menu/import/', MenuImportView.as_view(), name='menu-import'),
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', TenantTokenObtainPairView.as_view(), name='auth-login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='auth-refresh'),
    path('auth/me/', MeView.as_view(), name='auth-me'),
    path('auth/handoff/', AuthHandoffCreateView.as_view(), name='auth-handoff-create'),
    path('auth/handoff/consume/', AuthHandoffConsumeView.as_view(), name='auth-handoff-consume'),
    path('contact/', ContactView.as_view(), name='contact'),
    path('platform/branding/', PlatformBrandingPublicView.as_view(), name='platform-branding'),
    path('', include(router.urls)),
]
