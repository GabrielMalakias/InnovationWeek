ActiveAdmin.register Doodle::User::Analyst, as: "UserAnalyst"  do
  menu parent: 'Users'
  permit_params :login, :password, :concurrent_protocols

  form do |f|
    f.input :login
    f.input :password
    f.input :concurrent_protocols
    f.actions
  end

  show do
    attributes_table do
      row :login
      row :concurrent_protocols
      row :type
      row :created_at
      row :updated_at
    end
  end
end
