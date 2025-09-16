from rest_framework.pagination import PageNumberPagination
from core.utils.responses import ok

class StandardResultsSetPagination(PageNumberPagination):
    """
    Standard pagination class for all API list views.
    Usage: pagination_class = StandardResultsSetPagination
    """
    page_size = 10
    page_size_query_param = 'per_page'
    max_page_size = 100

    def get_paginated_response(self, data):
        pagination_info = {
            'current_page': self.page.number,
            'per_page': self.get_page_size(self.request),
            'total_pages': self.page.paginator.num_pages,
            'total_count': self.page.paginator.count,
            'has_next': self.page.has_next(),
            'has_previous': self.page.has_previous(),
            'next_page': self.page.next_page_number() if self.page.has_next() else None,
            'previous_page': self.page.previous_page_number() if self.page.has_previous() else None,
        }

        return ok(
            data={
                'results': data,
                'pagination': pagination_info
            },
            message="Data retrieved successfully"
        )

