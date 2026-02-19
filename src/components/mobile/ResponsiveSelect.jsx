import React, { useState } from 'react';
import { useMediaQuery } from '@/components/hooks/useMediaQuery';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';

export default function ResponsiveSelect({
  value,
  onValueChange,
  children,
  placeholder,
  disabled,
  ...props
}) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [open, setOpen] = useState(false);

  if (!isMobile) {
    return (
      <Select value={value} onValueChange={onValueChange} disabled={disabled} {...props}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {children}
        </SelectContent>
      </Select>
    );
  }

  const selectedItem = React.Children.toArray(children).find(
    child => child?.props?.value === value
  );

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="w-full justify-between"
      >
        {selectedItem ? selectedItem.props.children : placeholder}
      </Button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{placeholder}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4 space-y-2">
            {React.Children.map(children, child => {
              if (!child) return null;
              return (
                <Button
                  key={child.props.value}
                  variant={value === child.props.value ? 'default' : 'outline'}
                  onClick={() => {
                    onValueChange(child.props.value);
                    setOpen(false);
                  }}
                  className="w-full justify-start"
                >
                  {child.props.children}
                </Button>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}