export interface JwtPayload {
    sub: string;
    email: string;
    type: 'access';
    role?: string;
}
export declare const CurrentUser: (...dataOrPipes: (keyof JwtPayload | import("@nestjs/common").PipeTransform<any, any> | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>> | undefined)[]) => ParameterDecorator;
