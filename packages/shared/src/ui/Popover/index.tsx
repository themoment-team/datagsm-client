'use client';

import * as React from 'react';

import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '@repo/shared/utils';

function Popover({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverContent({
  className,
  align = 'center',
  sideOffset = 4,
  container,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content> & {
  /**
   * 기본값은 body다. 다이얼로그 안에서 쓸 때 다이얼로그 요소를 넘기면 다이얼로그의 스크롤 잠금·포커스 가두기
   * 범위 안에 그려져 목록이 휠로 스크롤된다. 넘기는 요소가 overflow로 내용을 자르면 팝오버도 잘린다.
   */
  container?: React.ComponentProps<typeof PopoverPrimitive.Portal>['container'];
}) {
  return (
    <PopoverPrimitive.Portal container={container}>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 border-foreground pixel-shadow z-50 w-72 rounded-none border-2 p-4 outline-none',
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

export { Popover, PopoverContent, PopoverTrigger };
