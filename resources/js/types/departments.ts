export interface DepartmentOffering {
    id: string;
    name: string;
    abbreviation: string | null;
    is_offered: boolean;
    is_compulsory: boolean;
}

export interface FacultyWithDepartments {
    id: string;
    name: string;
    departments: DepartmentOffering[];
}

export interface OfferingPayloadItem {
    [key: string]: string | boolean;
    department_id: string;
    is_compulsory: boolean;
}
